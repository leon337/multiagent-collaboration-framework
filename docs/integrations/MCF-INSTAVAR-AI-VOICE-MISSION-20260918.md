# MCF — Instavar AI Voice Mission checkpoint

**Mission:** `INSTAVAR-20260918-AI-VOICE-001`  
**Project:** `curso-instavar`  
**GitHub tracker:** https://github.com/leon337/curso-instavar/issues/16  
**State:** `EXECUTING / PHYSICAL_GATE_PENDING`  
**Human authority:** LEANDRO  
**Decision authority:** Leo  
**Orchestrator:** MESTRE

## Canonical repositories

- Product: `leon337/curso-instavar`
- Voice/interactivity: `leon337/voicehub-linux`
- Framework/registry: `leon337/multiagent-collaboration-framework`

## Reconciled state

### Curso Instavar

- V2.5 is the current product generation.
- Browser captures PCM/WAV for voice commands.
- `/api/transcribe` uses NVIDIA Riva gRPC and pt-BR.
- Parakeet Multilingual is primary ASR; Whisper Large v3 is fallback.
- Controlled production ASR test recognized “GPT, abra a aula seis” as “Gpt abra aula seis” with HTTP 200 in approximately 2 seconds.
- Tool Registry remains bounded and application-owned.
- Local deterministic command execution remains available as resilience/fallback.
- Project Capsule and mission contract are versioned in the project repository.

### VoiceHub Linux

- Bidirectional Chat Bridge is operational with `correlation_id`.
- NVIDIA Magpie PT-BR speech output has been validated.
- Mestre interaction panel completed the cycle user click → VoiceHub → ChatGPT → spoken response.
- Live critical runtime files were reconciled against the canonical repository before this checkpoint.
- Raw local deployment notes containing personal account identifiers were intentionally not copied to Git; a sanitized mission checkpoint is versioned instead.

### MCF

- `curso-instavar` is now a registered Project Registry entry.
- The project-owned capsule remains the recovery entrypoint for project state.
- GitHub/provider live state prevails over any volatile value in this checkpoint.

## Security boundary

No NVIDIA key, token, provider credential, browser credential, personal account identifier or local secret is stored in this record.

## Evidence lineage

- Instavar mission tracker: `leon337/curso-instavar#16`
- Instavar mission-state merge: `79db503636868e1ecb0bc9d557607b5960de8650`
- VoiceHub checkpoint merge: `fbcb36020f43a37a5f1b3477cb6e0490c7ce6f0d`
- Instavar V2.5 gRPC ASR code baseline: `0df36cb9622556ea1178f9c8f0df1b4ab79cd31f`

## Remaining gate

The sole acceptance gate still open for this mission boundary is a physical user-voice test:

`real voice → browser WAV capture → NVIDIA Riva gRPC → recognized command → Instavar tool execution → Aula 6 observed`

After that gate, update the mission issue, project capsule and this checkpoint with the physical evidence.
