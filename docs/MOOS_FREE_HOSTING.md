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
before publishing these redirects. Reverting those five rules restores the
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
build and 97 tests in 13 files; `verify:admin` passed typecheck, lint and build;
the R2 Worker passed all 21 tests; static export produced 74 files / 4,588,749
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


## Public restoration readback, 2026-10-10

The independent frontend was deployed as `moos-site`, version
`c5d846cc-bd46-409a-9b1a-84756d73d081`, after a pinned `npm ci` rebuild.
Both stations produced the same 74-file SHA-256 manifest
`c2d2bad7716aa7bbdd10d63fa8045f6f5c44cba08761eba74e0c764f1cd5e8b0`.
Eight public AR/EN Chromium views passed with no overflow, script errors,
missing images or Vercel calls; language switching, keyboard skip link,
reduced motion and actual Worker/download/script routes were exercised.

Because new Vercel deployments remain blocked at team level, the documented
Free project-route service restored the existing MoOS entrypoints without a
new deployment. Four scoped CDN 307 rules were initially made live, version
`2cfa20cd-85fd-46ff-875e-a87d1b83bcc8`: Arabic, English, `/moos` and
`/api/os/download`. Locale and query parameters survive. Non-MoOS pages,
activation/config APIs and admin retain their working production ownership.
The small initial CDN redirect still counts as a Vercel request; frontend,
images/fonts and subsequent downloads execute on Cloudflare.

Post-deletion Blob inventory confirmed all five MoPlayer objects unchanged,
333,653,409 bytes total, and the obsolete MoOS ISO absent. Anonymous browser
review rendered all fourteen projects at 390/1440 px: 28 frames, no JavaScript
errors or visibly broken images. A&D has a one-pixel desktop overflow, and four
Alhasaka image requests fail independently at their Supabase storage origin.
Its public response identifies `exceed_egress_quota`; do not remove spend caps,
activate a paid plan or invent replacement photographs. One actual cached
photograph was recovered privately. Account connection and a complete data
workflow/migration are still owed. These checks did not submit business forms,
orders or authenticated changes. A fresh 21:47 UTC HTTP readback confirms all
14 primary sites and 24 of 25 inventoried addresses return application pages;
the old A&D alias remains separately disabled.

## Immutable ISO retirement

The download Worker accepts exact .1022 ISO/signature/checksum sizes only.
The superseded .1011 keys return 410 with a link to the current frontend,
without querying R2 or redirecting an immutable file URL to different bytes.
The .1018 URL retains its original bytes for an announced grace window through
2026-10-11T15:00:00Z (17:00 Berlin), then returns the same explicit 410.
Tests exercise before/at-deadline GET and HEAD, resumed >4 GiB ranges,
unknown keys and no-R2-read retirement. Public upload/verification, deployment
and exact-key cleanup are separate actions; do not mark them complete from
these source tests. Keep one current public ISO to control storage use while
preserving the installed signed OS rollback independently.

Additional primary references:

- https://vercel.com/docs/cli/routes
- https://vercel.com/changelog/vercels-cdn-now-supports-updating-routing-rules-without-a-new-deployment
- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://supabase.com/docs/guides/platform/cost-control

The timed .1018 retirement is additionally gated by the reviewed deployment's
`PUBLISHED_ISO_VERSION=.1022`. Keep that marker at .1018 until the replacement's
full public proof and paired frontend metadata are deployed. A failed/delayed
upload must never expire the only advertised qualified release. The extra
native test proves >4 GiB resumes still work past the deadline when publication
has not happened. Exact-key deletion independently verifies the active public
manifest/proof/sidecars and the old path's 410 immediately before removing keys.


## Owner release publication

Exact .1022 ISO was uploaded to three new immutable R2 keys, then fully
verified anonymously on 2026-10-10T22:10:02.941997Z. Both sidecars matched the
local artifact byte for byte. Source 1a73a4e0 and all first-attempt proof/promotion
IDs are preserved in the paired .1022 manifest/public delivery receipt.
The latest maintained web verification passes typecheck/lint/build and 97 tests
in 13 files; R2 Worker has 21 meaningful boundary cases.

A fifth narrowly scoped 307 rule redirects only the four existing MoOS
manifest/proof/install scripts under `/downloads/moos/`. The actual Next path
matcher accepts those four files and rejects unrelated product/API/private/ISO
paths. This prevents an old direct metadata link advertising a retired version
while the canonical download API serves the new one. Native/public route
publication and refreshed frontend browser review remain separate evidence.

R2 .1011's three exact objects were deleted after explicit old-path 410 and
current .1018 qualification checks: 5,796,462,771 bytes reclaimed. .1018 remains
in the bounded grace period; deletion must additionally see .1022's coherent
public metadata and the announced .1018 410 before it touches those exact keys.


## Final public .1022 readback, 2026-10-11 Berlin

Source `166325e` passes all three GitHub verification jobs in run 38090992223.
The unchanged admin build initially hit a Turbopack Manrope font-query error;
its failed-job rerun passed without a code change. Preserve this intermittent
external-build evidence; it is not an OS release or a repaired Vercel preview.

The paired .1022 frontend is deployed as `moos-site` version
`fc9c2a50-0ae4-422b-b855-7d63c22fbd36`. Both stations produced exactly
74 files / 4,588,749 bytes, files-manifest SHA-256
`186aaa2b3df63063b223db8456d19eec165debdc4c5106f4a6fbd3f00e219512`.
Eight public AR/EN views passed at 22:22:10Z: fonts/images/input/language
switch/keyboard/reduced motion, exact installer and Worker responses, no
Vercel calls. Download Worker version `49a3c101-15ef-4dc0-91d5-5d9c4807b6c9`
now carries the qualified .1022 publication marker. All five CDN rules are
live in version `86e6e29f-c034-4fa2-9fce-02c13dd89983`. The final 22:24:46Z
readback passes 14 metadata/script/query/range/unrelated-route checks.

Oracle owns the bounded `moos-owner-retire-1018.timer`, scheduled at
2026-10-11 15:05 UTC (17:05 Berlin), with missed-run persistence. It calls
only the reviewed exact-three-key retirement script, which independently
refuses if current public qualification or the old immutable-path 410 fails.
This is scheduled cleanup, not evidence that .1018 has already been deleted.
The completed .1022 upload scratch is independently retired after matching
its full SHA-256 to the actual public proof; workstation current ISO and signed
installed rollback remain. Raw account and owner screenshots stay private.
