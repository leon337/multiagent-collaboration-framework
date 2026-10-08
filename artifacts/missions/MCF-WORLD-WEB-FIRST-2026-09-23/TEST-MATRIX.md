# Cross-platform Test Matrix (draft)

Targets:
- Windows 10 + Chromium-family browser
- Linux + Chromium-family browser
- Windows 10 + Electron shell (later)
- Linux + Electron shell (later)

Required checks:
- WebGL scene boot
- keyboard/pointer input
- PET movement/camera
- Local/portal interactions
- hosted navigation abstraction
- browser iframe policy fallback
- desktop Browser Surface path
- persistence contract
- smoke boot and return-to-world flow

Host-dependent Electron checks remain deferred until the offline notebook returns.
