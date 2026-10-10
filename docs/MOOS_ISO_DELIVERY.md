# MoOS ISO delivery

The public Arabic/English frontend is
`https://moos-site.moalfarras-moos.workers.dev/ar/` or `/en/`.
Existing `moalfarras.space` MoOS entrypoints use scoped CDN redirects to that
independent static host. ISO requests use `/api/os/download?type=iso`, with
`asset=signature` or `asset=checksum` for verification files. R2 bytes stream
from the separate `moos-downloads` Worker; no multi-GB file is buffered by a
Vercel function. See [the independent hosting handoff](MOOS_FREE_HOSTING.md).

The private R2 Standard bucket `moos-releases` is served by a persistent named
Worker, not an expiring preview or `r2.dev` URL. Existing site DNS remains intact.
A dedicated custom download/service domain remains an operating improvement;
workers.dev has been publicly verified but is not a promise of unbounded quotas.

## Qualified release

- Version: `44.20261010.1022`, generic x86-64 UEFI desktop ISO.
- Source: `1a73a4e08b33d5a49f0eda42947acaca037d0d9a`.
- Image: `sha256:8134f32a09ab4ff2301554a7bac16858e7d48d907ec7bd48631b5fd35e97fef1`.
- ISO: 5,827,067,904 bytes, SHA-256
  `0927826e1d28cbbd8c9054ba19b49c9904184c9f0ea304bf60050dfc76d926f3`.
- Final ISO/offline-install run: `38051456847`; x86 promotion `38053736733`.
- Signed build `38042999495`; disks `38051449009`, `38051451818`,
  `38051454259`, all first-attempt successes at the same source.
- Complete anonymous transfer/hash/signature/ranges passed
  `2026-10-10T22:10:02.941997+00:00`, then both public sidecars matched locally.
  Receipt and manifest are paired in `apps/web/public/downloads/moos/`.

The superseded .1011 URLs explicitly return 410 and only their three exact
objects were deleted. .1018 keeps original resumable bytes through its announced
grace window, then is retired only after .1022 has been publicly qualified and
advertised. No immutable file URL is silently redirected to different bytes.
A separate exact-key cleanup verifies the active manifest/proof/sidecars and
old 410 before deletion; installed signed OS rollback is independent.

The preserved `.iso`, `.sig` and `.sha256` bytes match the qualified CI
artifact. The backend supports HEAD, full HTTP 200 and HTTP 206 ranges beyond
4 GiB, including suffix and resumed downloads. It serves only the explicit
release files: no listing, upload route or arbitrary bucket-object access.
It refuses inconsistent sizes, objects changed during a request and incorrect returned ranges.
The R2 response body passes through as a stream, keeping memory bounded.

NVIDIA/cloud are separately signed image editions with installer scripts;
ARM uses QCOW2/UTM images and its own installation guide. Do not label those
scripts or CI disk fixtures as consumer ISOs. Hardware sizing is advice;
the successful VM journey does not qualify every PC, GPU or suspend path.

## Publishing and verification

Use the pinned Wrangler 4.148.0 to deploy
`apps/web/cloudflare/moos-downloads/wrangler.jsonc`, with the intended account
checked before deployment. Upload with an object read/write token restricted
to `moos-releases`; rclone needs `no_check_bucket = true` for object-only tokens.
Credentials live only in the operator's private configuration, never Git.
Keep immutable version paths. Add future qualified releases to the Worker
allowlist rather than replacing existing paths silently.

Before setting `iso.available`, run MoOS's maintained
`scripts/verify-public-iso.py` against the preserved signed artifact and actual
anonymous HTTPS endpoint. Verify both sidecars byte-for-byte too. Commit the
successful public receipt with the manifest; the manifest-integrity unit gate
cross-checks URL, size, SHA-256, checked time, signature and HTTP/range results.
Incomplete or credential-bearing CMS URLs remain unavailable. The owner's
maintenance switch still stops site downloads. Recheck the final site
entrypoint after production deployment.

Cloudflare R2 Standard includes 10 GB-month and free direct egress; a single
5.8 GB ISO fits the storage allowance when no other data consumes it. Extra
versions/storage and operations above the allowance are billable. Workers
Free allows 100,000 requests/day. These are provider allowances, not an
enforced spending cap. [R2 pricing](https://developers.cloudflare.com/r2/pricing/),
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/).

## Security and local build evidence

The publishing batch pins Sharp 0.35.5, source-map-js 1.2.2 and
http-cache-semantics 4.3.0 for their published security corrections. Production
dependency audit reports zero findings. The unpatched `braces` 3.0.3 advisory
remains in the development-only ESLint dependency tree; do not downgrade Next
or remove lint gates to conceal it.

Linux ARM native optional packages for Lightning CSS 1.32.0 and Tailwind Oxide
4.2.2 are declared alongside the existing platform packages, so the Oracle A1
can perform the same maintained web/admin build checks. No host RPM layering,
production environment disclosure or Android release changes are needed.

Local validation on the Oracle A1: maintained web typecheck, lint, production
build and complete unit suite passed; admin typecheck, lint and production
build and dashboard build passed. `verify:production` then stopped at the
unchanged Android `gradlew.bat` command, which cannot run on Linux (exit 127).
No Android code or release changed in this batch. Browser QA passed the MoOS
page in Arabic and English at 1440px and 390px with Reduced Motion enabled,
without hydration errors or horizontal overflow. The required public app,
activation and config smoke routes responded successfully. A real Reduced
Motion hydration mismatch in the shared tilt decoration was corrected by
keeping identical markup and hiding the decoration through the CSS preference.

The standalone web, admin and Windows lockfile snapshots are synchronized to
the corrected authoritative workspace lock, incorporating Dependabot #49/#50.
Standalone production audits pass with zero findings. GitHub also reports
the unpatched development-only `sprintf-js` advisory (GHSA-hp3w-g68c-fv3c);
its production impact must not be inferred from the repository-wide alert
count. No Windows executable was rebuilt or published: this Linux ARM Oracle
host does not provide the Windows packaging/smoke environment. Existing
Windows 1.0.4 artifacts and Android releases remain unchanged.
