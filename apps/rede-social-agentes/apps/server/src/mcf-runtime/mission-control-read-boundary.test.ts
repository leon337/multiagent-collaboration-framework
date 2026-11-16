import 'reflect-metadata';

const GUARDS_METADATA = '__guards__';
const METHOD_METADATA = 'method';
const PATH_METADATA = 'path';
import { RequestMethod } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { MissionControlController } from './mission-control.controller.js';
import { McfMissionControlTokenGuard } from './mission-control-token.guard.js';
import { McfMissionControlReadTokenGuard } from './mission-control-read-token.guard.js';

function guardsFor(method: (...args: never[]) => unknown): unknown[] {
  return (Reflect.getMetadata(GUARDS_METADATA, method) as unknown[]) ?? [];
}

describe('Mission Control independent observation boundary', () => {
  it('binds GET read/latest only to the observation credential', () => {
    const method = MissionControlController.prototype.latestReadOnly;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('read/latest');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.GET);
    expect(guardsFor(method)).toContain(McfMissionControlReadTokenGuard);
    expect(guardsFor(method)).not.toContain(McfMissionControlTokenGuard);
  });

  it('preserves the original dispatch credential for POST', () => {
    const method = MissionControlController.prototype.dispatch;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('dispatch');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.POST);
    expect(guardsFor(method)).toContain(McfMissionControlTokenGuard);
    expect(guardsFor(method)).not.toContain(McfMissionControlReadTokenGuard);
  });

  it('retains the legacy GET/latest credential for existing clients', () => {
    const method = MissionControlController.prototype.latest;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('latest');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.GET);
    expect(guardsFor(method)).toContain(McfMissionControlTokenGuard);
  });

  it('does not apply the dispatch guard globally to the class', () => {
    const guards = (Reflect.getMetadata(GUARDS_METADATA, MissionControlController) as unknown[]) ?? [];
    expect(guards).not.toContain(McfMissionControlTokenGuard);
  });
});
