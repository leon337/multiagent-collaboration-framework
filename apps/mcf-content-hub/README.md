# MCF Content Hub

Persistent review and delivery surface for MCF Content Studio outputs.

V1 pipeline:
N4 render -> QA -> Vercel Blob -> manifest -> Content Hub -> REVIEW -> HUMAN_GATE -> PUBLISHED

Uploading a video does not mark it as externally published. The publisher script always creates or updates the record in REVIEW.

Local:
1. corepack enable
2. pnpm install
3. pnpm dev

Without BLOB_READ_WRITE_TOKEN, the app reads data/seed-content.json so build and review remain deterministic.

Persistent storage:
Connect a PRIVATE Vercel Blob store to the project. Vercel provides BLOB_READ_WRITE_TOKEN. Media stays private in Blob and is streamed through the Content Hub server route.

Example publish command:
pnpm exec node scripts/publish-content.mjs --file=video.mp4 --slug=n4-showcase-engine-v1-1 --title="N4 Showcase — Engine" --version=1.1 --mission=MCF-CONTENT-STUDIO-N4-SHOWCASE-PACK-001 --issue=279 --pr=280 --commit=<sha> --run=showcase-v1.1

Set the Vercel Root Directory to apps/mcf-content-hub.

Preview deployment is the first target. Production/domain cutover remains a separate HUMAN_GATE.
