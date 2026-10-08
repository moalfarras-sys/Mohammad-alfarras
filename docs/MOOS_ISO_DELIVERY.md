# MoOS ISO delivery

The public page is `/ar/moos` or `/en/moos`. Its stable download entrypoint is
`/api/os/download?type=iso`; verification files use `&asset=signature` and
`&asset=checksum`. The route redirects to the Cloudflare download service so
multi-GB files are streamed from R2 rather than buffered by a Vercel function.

The website keeps its existing domain and DNS provider. The download backend
is the named Worker `moos-downloads.moalfarras-moos.workers.dev`, backed by the
private R2 Standard bucket `moos-releases`. This is a persistent account Worker,
not an expiring preview or an `r2.dev` link. Cloudflare recommends a custom
domain for business-critical workloads; a dedicated download subdomain can
be attached after the complete registrar DNS inventory is available. See
[Workers routing](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).

## Qualified release

- Version: `44.20261007.1011`, generic x86-64 UEFI desktop ISO.
- Source: `fa85b2daf3db0f1f823b3159bb46b25571a99740`.
- Image: `sha256:c3689b0e64c48cdf7d5de7d83b3dc156bf264f6381cce98d36376681b07ebf99`.
- ISO: 5,796,462,592 bytes, SHA-256
  `cbe92573e620101f274081c884671e4b63ffbcdb765521713d21ada1dbe9cb1c`.
- Final ISO/offline-install run: `37558755639`; x86 promotion `37562359722`.
- Signed build `37552824167`; disk proofs `37558743993`, `37558747906`,
  `37558751431`, all first-attempt successes at the same source.
- Full anonymous delivery and detached-signature verification passed
  `2026-10-08T10:19:36.980092+00:00`. Receipt:
  `apps/web/public/downloads/moos/delivery-proof.json`.

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
