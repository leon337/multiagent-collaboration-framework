import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

import { Ajv2020, type AnySchema, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';

export interface ContextSchemaValidationError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  message: string;
}

export type ContextSchemaValidationResult =
  { valid: true; errors: [] } | { valid: false; errors: ContextSchemaValidationError[] };

const RFC_3339_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/;

function readSchema(path: string): AnySchema {
  return JSON.parse(readFileSync(path, 'utf8')) as AnySchema;
}

function normalizeError(error: ErrorObject): ContextSchemaValidationError {
  return {
    instancePath: error.instancePath,
    schemaPath: error.schemaPath,
    keyword: error.keyword,
    message: error.message ?? 'schema validation failed',
  };
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isRfc3339DateTime(value: string): boolean {
  const match = RFC_3339_DATE_TIME.exec(value);
  if (!match) return false;

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    ,
    offsetHourText,
    offsetMinuteText,
  ] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = offsetHourText === undefined ? 0 : Number(offsetHourText);
  const offsetMinute = offsetMinuteText === undefined ? 0 : Number(offsetMinuteText);
  const daysByMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= (daysByMonth[month - 1] ?? 0) &&
    hour <= 23 &&
    minute <= 59 &&
    // The canonical profile intentionally excludes leap-second notation.
    second <= 59 &&
    offsetHour <= 23 &&
    offsetMinute <= 59
  );
}

function findNonJsonValue(
  value: unknown,
  instancePath = '',
  ancestors = new Set<object>(),
): string | null {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? null : instancePath;
  if (typeof value !== 'object') return instancePath;

  if (ancestors.has(value)) return instancePath;
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    return instancePath;
  }

  ancestors.add(value);
  if (Array.isArray(value)) {
    if (Object.getOwnPropertySymbols(value).length > 0) {
      ancestors.delete(value);
      return instancePath;
    }

    const ownNames = Object.getOwnPropertyNames(value);
    if (
      ownNames.some(
        (name) =>
          name !== 'length' && (!/^(?:0|[1-9]\d*)$/.test(name) || Number(name) >= value.length),
      )
    ) {
      ancestors.delete(value);
      return instancePath;
    }

    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, index);
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
        ancestors.delete(value);
        return `${instancePath}/${index}`;
      }
      const invalidPath = findNonJsonValue(descriptor.value, `${instancePath}/${index}`, ancestors);
      if (invalidPath !== null) {
        ancestors.delete(value);
        return invalidPath;
      }
    }
  } else {
    if (Object.getOwnPropertySymbols(value).length > 0) {
      ancestors.delete(value);
      return instancePath;
    }

    for (const key of Object.getOwnPropertyNames(value).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
        ancestors.delete(value);
        return `${instancePath}/${key}`;
      }
      const escapedKey = key.replaceAll('~', '~0').replaceAll('/', '~1');
      const invalidPath = findNonJsonValue(
        descriptor.value,
        `${instancePath}/${escapedKey}`,
        ancestors,
      );
      if (invalidPath !== null) {
        ancestors.delete(value);
        return invalidPath;
      }
    }
  }

  ancestors.delete(value);
  return null;
}

function compareErrors(
  left: ContextSchemaValidationError,
  right: ContextSchemaValidationError,
): number {
  const leftKey = JSON.stringify(left);
  const rightKey = JSON.stringify(right);

  if (leftKey < rightKey) return -1;
  if (leftKey > rightKey) return 1;
  return 0;
}

export class ContextSchemaValidator {
  private readonly compiled: ValidateFunction;

  constructor(schemaPath: string) {
    const primaryPath = resolve(schemaPath);
    const schemaDirectory = dirname(primaryPath);
    const primaryFilename = basename(primaryPath);
    const ajv = new Ajv2020({
      allErrors: true,
      strict: true,
      coerceTypes: false,
      useDefaults: false,
      removeAdditional: false,
    });
    ajv.addFormat('date-time', {
      type: 'string',
      validate: isRfc3339DateTime,
    });

    for (const filename of readdirSync(schemaDirectory).sort()) {
      if (filename.endsWith('.schema.json') && filename !== primaryFilename) {
        ajv.addSchema(readSchema(join(schemaDirectory, filename)));
      }
    }

    this.compiled = ajv.compile(readSchema(primaryPath));
  }

  validate(value: unknown): ContextSchemaValidationResult {
    const invalidJsonPath = findNonJsonValue(value);
    if (invalidJsonPath !== null) {
      return {
        valid: false,
        errors: [
          {
            instancePath: invalidJsonPath,
            schemaPath: '#/json-safe',
            keyword: 'jsonSafe',
            message: 'must be a finite, acyclic JSON value without accessors',
          },
        ],
      };
    }

    if (this.compiled(value)) {
      return { valid: true, errors: [] };
    }

    return {
      valid: false,
      errors: (this.compiled.errors ?? []).map(normalizeError).sort(compareErrors),
    };
  }
}
