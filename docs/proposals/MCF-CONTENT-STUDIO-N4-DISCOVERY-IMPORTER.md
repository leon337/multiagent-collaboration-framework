# N4 Template Discovery and Project Extraction

## Template discovery

`searchTemplates()` supports:
- intent;
- tags;
- node count;
- aspect;
- learning mode;
- required component compatibility;
- max complexity;
- lifecycle status.

This implements the source-level behavior of asking for a template by the pedagogical problem rather than by filename.

## External project extraction

The importer now has a project-level planning boundary.

A project is never copied wholesale by default.

Each candidate is classified:
- `ELIGIBLE`;
- `REVIEW_REQUIRED`;
- `REJECTED`.

Network access, dynamic code, unbounded dependencies and unsupported file types stop automatic eligibility.

A candidate still needs the existing component import manifest, adaptation, tests and registry promotion before becoming `APPROVED`.
