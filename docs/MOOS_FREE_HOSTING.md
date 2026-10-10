# MoOS independent hosting and the Vercel incident

## Ownership and delivery

MoOS's independent public frontend targets
`https://moos-site.moalfarras-moos.workers.dev`. Build its existing React page
with `npm --prefix apps/web run build:moos-static`. Deploy only
`apps/web/cloudflare/moos-site/wrangler.jsonc`, with explicit `--config` and
`--autoconfig=false`. Use the account's managed Wrangler login; never commit
tokens or copy a private account profile between machines.

HTML, CSS, JavaScript, images, installer scripts and licensed, self-hosted fonts
are Cloudflare Static Assets. Only `/api/os/download*` invokes the small redirect
Worker. ISO bytes and verification files stream from the existing dedicated R2
download Worker. Community/Mira services remain on Oracle. No CMS, visit beacon,
Vercel Image Optimization, shared site assistant, analytics or Vercel request is
part of the independent MoOS page. Other products' activation, admin and APIs
retain their existing ownership.

The builder refuses incoherent ISO/proof records and foreign download origins.
Only the boot-proven, signed public release is advertised. A source merge or a
running candidate is never a new public ISO. Update `latest-moos.json` and
`delivery-proof.json` together, build, review, then deploy the independent site.
Live dashboard edits no longer modify this isolated publication automatically;
they need the same reviewed publication. Maintenance remains a fail-closed
published setting. Keep the existing public R2 byte/range/signature acceptance.

MoOS entrypoint redirects in Next config run before its locale proxy and CMS
rendering. They preserve locale and download queries, use reversible 307s, and
leave MoPlayer/admin paths alone. Deploy the independent host and review it
before publishing these redirects. Reverting those four rules restores the
original website entrypoints without rewriting history or ISO object bytes.

## Visual specification and handoff

Reuse the shared `MoosV3` implementation and Site v3 Hologram Studio tokens;
do not fork the product page or invent new OS screenshots. Dark teal MoOS glass,
existing cyan/prism accents, bounded rounded panels, Alexandria Arabic headings,
Cairo body, Manrope English and Instrument Serif accent remain authoritative.
The compact MoOS header has Source, Mira, Download and AR/EN switching. Arabic
uses RTL and logical layout; download/proof links remain ordinary accessible
anchors. A first-tab skip link, visible focus, fluid 390–1920 px layout and
reduced-motion support are mandatory. Installer/ISO availability is explained
from actual release metadata. An app-directory link outside this isolated site
is omitted rather than presented as local navigation.

`adapters.tsx` replaces only Next image/link transport for this build. Existing
motion components and layout remain shared. `review.mjs` launches isolated
Chromium, renders Arabic/English at 390, 768, 1440 and 1920, checks all loaded
images, console errors, overflow, fonts, skip-link keyboard focus, an actual
language-switch click, Worker status codes, exact installer script bytes and
absence of any Vercel network call. Screenshots/receipts are private QA artifacts,
not committed fixtures. Local review is not public deployment proof.

## Incident evidence, 2026-10-10

Authenticated Vercel team metadata reported Hobby billing `active`, with
`softBlock.reason=FAIR_USE_LIMITS_EXCEEDED`,
`blockedDueToOverageType=fluidCpuDuration`,
`blockedAt=2026-10-09T23:50:43.666Z`. This is 01:50 on 10 October in Berlin.
Fourteen projects were inventoried. Their production builds generally remained
READY; public sites returned 402 DEPLOYMENT_DISABLED. The documented per-project
unpause operation restored their primary sites to actual application pages
(HTTP 200, including expected authentication pages). The team's soft-block
record remains: restored delivery does not reset measured usage or guarantee
that the same limits cannot pause it again.

The owner dashboard reported CPU 11h40/4h, ISR writes 839K/200K, Blob storage
6.22GB/1GB and origin transfer 12.12GB/10GB. These are team-wide figures. CLI
cost usage was unavailable on this Hobby account; project CPU breakdown queries
required paid Observability Plus. Do not invent a per-project CPU attribution or
activate a paid plan to obtain it.

Blob inventory identified an obsolete September 15 MoOS ISO of 5,884,149,760
bytes and five MoPlayer APK/Windows assets totaling 333,653,409 bytes. This
demonstrates MoOS's Blob storage contribution, not its exact CPU contribution.
The current .1018 ISO is separately qualified on R2. Retire only that obsolete
Blob ISO after checking current download routing; preserve the other products.
Removal reduces future stored bytes; historical monthly-average usage is not
erased. R2's allowance is also account-wide and measured in GB-months, not an
instant enforced 10 GB capacity limit.

Pünktlich's newer deployment has a separate Git-author access BLOCKED error;
its older READY production site works after unpause. Preserve that error and
the existing production build until the current source is independently
reviewed. A&D's custom domain works, while an old vercel.app alias was still
disabled; a same-deployment alias refresh was rejected by team fair-use policy.
Do not claim that these deployment/alias issues were repaired by HTTP 200 on
another address.

## Acceptance and operational limits

Run `verify:web`, `verify:admin`, the R2 Worker node tests and the static export.
The broader `verify:production` also includes dashboard/Android checks: record
their actual outcomes, including any Windows Gradle command that cannot execute
on Linux; no Android release is implied by this frontend deployment.

Before release, record the public Worker deployment/version, then run the
eight-view browser review against that public URL and verify old MoOS entrypoint
redirects after the Vercel deployment. Store authenticated account JSON only in
the private incident directory, never repository docs. Remove the isolated
temporary env-pull file after the Blob operation; preserve managed CLI login.

Measured in this implementation: `verify:web` passed typecheck, lint, production
build and 96 tests in 13 files; `verify:admin` passed typecheck, lint and build;
the R2 Worker passed all 18 tests; static export produced 74 files / 4,588,761
bytes; eight local Chromium views and real language/Worker/script checks passed
with no Vercel calls. The dashboard build passed after installing its already
declared dependency. `verify:production` then stopped at the repository's
Windows-only `gradlew.bat` command on Linux (exit 127). Android source was not
changed and no Android build/deployment is included. Public deployment and
post-deployment route checks are separate evidence to record below.

The obsolete September Blob ISO was deleted on 2026-10-10T12:57:14Z with an
exact-size/ETag precondition. The current public Next download route was measured
to redirect to the .1018 R2 object before deletion. The five unrelated MoPlayer
assets were preserved. Subsequent inventory must confirm their exact sizes and
the retired object’s absence before calling storage cleanup complete.

Cloudflare static-asset requests are free/unlimited under the reviewed provider
policy, while Worker execution has a separate Free daily quota. R2 Standard has
10 GB-month free storage and operation allowances; egress is free. Oracle and
all provider account quotas need independent monitoring. This architecture
isolates MoOS from Vercel usage; it does not make all external services unlimited.

Primary references checked 2026-10-10:

- https://vercel.com/docs/errors/deployment_disabled
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/rest-api/projects/unpause-a-project
- https://vercel.com/docs/vercel-blob/usage-and-pricing
- https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://developers.cloudflare.com/r2/pricing/
