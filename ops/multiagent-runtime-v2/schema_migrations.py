from __future__ import annotations

import copy
import re
from dataclasses import dataclass
from typing import Any, Callable


class SchemaMigrationError(RuntimeError):
    pass


class SchemaFamilyMismatch(SchemaMigrationError):
    pass


class SchemaDowngradeDenied(SchemaMigrationError):
    pass


class SchemaMigrationPathMissing(SchemaMigrationError):
    pass


_SCHEMA_RE = re.compile(r"^(?P<family>[a-z0-9_\-]+)/v(?P<version>[1-9][0-9]*)$")


@dataclass(frozen=True)
class SchemaId:
    family: str
    version: int

    @classmethod
    def parse(cls, value: str) -> "SchemaId":
        match = _SCHEMA_RE.match(str(value))
        if not match:
            raise SchemaMigrationError(f"invalid schema id: {value!r}")
        return cls(match.group("family"), int(match.group("version")))

    def __str__(self) -> str:
        return f"{self.family}/v{self.version}"


MigrationFn = Callable[[dict[str, Any]], dict[str, Any]]


@dataclass(frozen=True)
class MigrationStep:
    source: SchemaId
    target: SchemaId
    migrate: MigrationFn


class MigrationRegistry:
    def __init__(self):
        self._steps: dict[tuple[str, int], MigrationStep] = {}

    def register(self, source_schema: str, target_schema: str, fn: MigrationFn) -> None:
        source = SchemaId.parse(source_schema)
        target = SchemaId.parse(target_schema)
        if source.family != target.family:
            raise SchemaFamilyMismatch(f"schema family mismatch: {source.family} -> {target.family}")
        if target.version != source.version + 1:
            raise SchemaMigrationError(f"only adjacent upgrades may be registered ({source} -> {target})")
        key = (source.family, source.version)
        if key in self._steps:
            raise SchemaMigrationError(f"migration already registered from {source}")
        self._steps[key] = MigrationStep(source, target, fn)

    def plan(self, source_schema: str, target_schema: str) -> list[MigrationStep]:
        source = SchemaId.parse(source_schema)
        target = SchemaId.parse(target_schema)
        if source.family != target.family:
            raise SchemaFamilyMismatch(f"schema family mismatch: {source.family} -> {target.family}")
        if target.version < source.version:
            raise SchemaDowngradeDenied(f"downgrade denied: {source} -> {target}")
        if target.version == source.version:
            return []

        plan: list[MigrationStep] = []
        current = source.version
        while current < target.version:
            step = self._steps.get((source.family, current))
            if step is None:
                raise SchemaMigrationPathMissing(
                    f"missing migration hop: {source.family}/v{current} -> {source.family}/v{current + 1}"
                )
            plan.append(step)
            current += 1
        return plan

    def migrate(self, document: dict[str, Any], source_schema: str, target_schema: str) -> dict[str, Any]:
        result = copy.deepcopy(document)
        for step in self.plan(source_schema, target_schema):
            migrated = step.migrate(copy.deepcopy(result))
            if not isinstance(migrated, dict):
                raise SchemaMigrationError(f"migration {step.source}->{step.target} returned non-object")
            result = migrated
        return result


MIGRATION_POLICY = {
    "mode": "explicit_adjacent_fail_closed",
    "downgrade": "denied",
    "cross_family": "denied",
    "missing_path": "denied",
}
