# Errata — Human Evidence Manifest Secondary Hashes

Status: **CORRECTION RECORD / APPEND-ONLY AUDIT EXPLANATION**

Date: 2026-08-26

Producer: **MESTRE**

Human authority: **LEANDRO**

Affected file:

`docs/integrations/evidence/MCF-COPRESENCE-CIRCUIT-HUMAN-EVIDENCE-MANIFEST-20260826.json`

## 1. What happened

The initial manifest commit `ff34bf32b14688fad9b27a0864cf2785a3a0abc4` correctly recorded all file byte sizes and SHA-256 values, but contained incorrect SHA-512 and BLAKE2b-256 values for five of the ten supplied files.

The error was detected by MESTRE during an immediate recomputation directly over the original uploaded bytes in `/mnt/data`, before the audit PR was opened or any merge was attempted.

The manifest was corrected in commit:

`908e101902a4b4d95dcef3ed0b091fec0969d6f9`

Git history intentionally preserves the erroneous first revision. It was not force-rewritten.

## 2. Scope of the error

**Unaffected for all 10 files:**

- file name
- byte count
- SHA-256
- JPEG dimensions/mode/EXIF count
- MP4 ffprobe metadata

**Incorrect only in the first revision:** SHA-512 and BLAKE2b-256 for the following five files.

### `1000855430.jpg`

- SHA-512 old/incorrect: `4b7d22e22a93ddbd080238e72171047980805947fb8ae16abef86d41ce0c05e92869a035e15004b552372e101ed231ecb79dc5479d728de13415e8f3fd523341`
- SHA-512 corrected: `be875980942c6f8d71bcd4012eed1f3d077b2070eaf3874f074aaf9c4d3b2f015407c192ba586b7e2345865a52d20a07361058b49205c4fea5f340521ceead76`
- BLAKE2b-256 old/incorrect: `071473932208232caf4524fac9bef46dd685926f60976a000d5e2af0138aa387`
- BLAKE2b-256 corrected: `b868bce5c6ef5211214d190b7d29f474fbe93449af6e8269b761996971c24ac6`

### `1000855432.jpg`

- SHA-512 old/incorrect: `83f445c506cb5eaf2ff5248d0366bb45920a4ce0c686d3079225251aab7d99bba86039abe0175e13140194054747f3a3da7b1ba1c5ed718378743b30971ad2fd`
- SHA-512 corrected: `5e557eaecdef630b2b938f6e3216cca325179fdb77a8aa0a95fc9f961587c67d27d2b690dddb94a781c415d5599b60a00c21890c89e53ebf2f45438bc4047ea7`
- BLAKE2b-256 old/incorrect: `67cb548b2b23d8c04ba555e3bdb2bb70177a26f7097161af6cf30c8b8befd193`
- BLAKE2b-256 corrected: `b3402a8cbbc074e267f183202b0689f049ec0b2db78878ec7e34ad21c54f89d8`

### `1000855433.mp4`

- SHA-512 old/incorrect: `41b184d41db8c395ba71e45f9e6bcaec04362268205cf8b74d73e879d686517cab0605bd17bdb59b15eb005c172893e611b9743c72a3a45e68250059157f5172`
- SHA-512 corrected: `a64d6bcad8d924db9c089d8d43bd96913a73dd0d2c1e103e12c3d4e8b59c8d9fdebb07cf63a2e6dc0a47a0737356ec9590339ff6d07c02a4ac7a909379d39366`
- BLAKE2b-256 old/incorrect: `724884914398d2ef25c2d88e637b79120fa2d17aff9d90a7de25ab0ea7ef70f2`
- BLAKE2b-256 corrected: `ddea12507dd932e90ff2518fe9e8a71705371f5965572e4f37b6326de21fbfd4`

### `1000855434.jpg`

- SHA-512 old/incorrect: `bf0210708828043326e52b8e5ae5f59092584df04a2201fe9d0a7a35f001046d029898d17ba89e40de89c2fe0679c1112eb6ef28547e8ce2c9b7f6967c342efa`
- SHA-512 corrected: `e23c9edf722beb063615e80e7246654a5908be7de2bea645426886ae4e7c92f03e4b7427995530e18ba1f88a745d7c03b8eab5bd090af4300dcd87e1b45301fd`
- BLAKE2b-256 old/incorrect: `d9c2386a8b69128cf372fd41cff2385773b3e0ee30e11edc7a4c506a9bca887b`
- BLAKE2b-256 corrected: `5b50b56dba075c85b6dfdb9561315091270ad6880e591439b067b7e3bd4bdd08`

### `1000855435.jpg`

- SHA-512 old/incorrect: `0d30e40d7e219d8601057e162b729088d7c991c306cb505744f564d9a5ab811f91d2ae4c3152a1313ef99729660132c053ffb65e31db9b6fc182bf12af63f773`
- SHA-512 corrected: `fb99167122fa460a0c517eddc3ad8b07479b0586e223f24a23aa6092b866d6bda520313b3ecf0f28c5c9e758249d4a2062645c603d09f69290d748d8500af17c`
- BLAKE2b-256 old/incorrect: `4f3da424d1cc8aaa72b0fcc90380e8837618fd56362ce6f7410369ac891c10d9`
- BLAKE2b-256 corrected: `4f3da424d1cc8aaa72b0fcc90380e8837618fd56362ce6f7410362870f66b676`

## 3. Audit consequence

The primary SHA-256 identity anchors used elsewhere in the audit remain valid. Nevertheless, because LEANDRO explicitly required byte-level auditability, the secondary-hash error is treated as a first-class audit event rather than silently repaired.

Future consumers must use the manifest at or after commit `908e101902a4b4d95dcef3ed0b091fec0969d6f9` and should retain this errata beside it.

— MESTRE
