# Governed Importer

The importer is a review pipeline, not an auto-installer.

```text
source
→ revision pin
→ license evidence
→ dependency inventory
→ security review
→ performance review
→ N4 adaptation
→ tests
→ preview
→ approval
```

Hard rules:
- no `latest` dependencies for approved imports;
- no approval without license evidence;
- no automatic execution of downloaded scripts;
- network/dynamic-code imports require dedicated review;
- APPROVED is a governance state, not a download result.
