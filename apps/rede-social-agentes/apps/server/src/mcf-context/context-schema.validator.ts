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
const MAX_JSON_DEPTH = 64;
const MAX_JSON_NODES = 10_000;

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

function findNonJsonValue(value: unknown): string | null {
  const pending: Array<{ value: unknown; instancePath: string; depth: number }> = [
    { value, instancePath: '', depth: 0 },
  ];
  const seen = new WeakSet<object>();
  let visitedNodes = 0;

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;

    visitedNodes += 1;
    if (visitedNodes > MAX_JSON_NODES || current.depth > MAX_JSON_DEPTH) {
      return current.instancePath;
    }

    const currentValue = current.value;
    if (
      currentValue === null ||
      typeof currentValue === 'string' ||
      typeof currentValue === 'boolean'
    ) {
      continue;
    }
    if (typeof currentValue === 'number') {
      if (!Number.isFinite(currentValue)) return current.instancePath;
      continue;
    }
    if (typeof currentValue !== 'object') return current.instancePath;
    if (seen.has(currentValue)) return current.instancePath;
    seen.add(currentValue);

    const prototype = Object.getPrototypeOf(currentValue);
    if (!Array.isArray(currentValue) && prototype !== Object.prototype && prototype !== null) {
      return current.instancePath;
    }
    if (Object.getOwnPropertySymbols(currentValue).length > 0) return current.instancePath;

    const children: Array<{ value: unknown; instancePath: string; depth: number }> = [];
    if (Array.isArray(currentValue)) {
      const ownNames = Object.getOwnPropertyNames(currentValue);
      if (
        ownNames.some(
          (name) =>
            name !== 'length' &&
            (!/^(?:0|[1-9]\d*)$/.test(name) || Number(name) >= currentValue.length),
        )
      ) {
        return current.instancePath;
      }

      for (let index = 0; index < currentValue.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(currentValue, index);
        if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
          return `${current.instancePath}/${index}`;
        }
        children.push({
          value: descriptor.value,
          instancePath: `${current.instancePath}/${index}`,
          depth: current.depth + 1,
        });
      }
    } else {
      for (const key of Object.getOwnPropertyNames(currentValue).sort()) {
        const descriptor = Object.getOwnPropertyDescriptor(currentValue, key);
        const escapedKey = key.replaceAll('~', '~0').replaceAll('/', '~1');
        if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
          return `${current.instancePath}/${escapedKey}`;
        }
        children.push({
          value: descriptor.value,
          instancePath: `${current.instancePath}/${escapedKey}`,
          depth: current.depth + 1,
        });
      }
    }

    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child) pending.push(child);
    }
  }

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
            message: 'must be a bounded, finite, acyclic JSON value without aliases or accessors',
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
