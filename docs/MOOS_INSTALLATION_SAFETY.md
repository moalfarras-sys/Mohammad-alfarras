# MoOS installation entrypoints

The published generic x86-64 ISO remains qualified .1026. Its exact manifest,
proof, signature and checksum are unchanged by this fix. Newer signed OS image
promotion is separate from public ISO delivery.

The MoOS page now links that qualified desktop ISO and a bilingual installation
guide. NVIDIA, Cloud and ARM have distinct image/install boundaries; the guide
does not describe the generic ISO as their installer. Existing MoOS computers
use System Settings → Updates or `moai-do update`, which resolves an immutable
signed image through the OS authority.

The former conversion entrypoints offered a mutable `:latest` switch after a
separate signature check, or allowed installation when cosign was unavailable.
They are now inert guidance scripts: help succeeds, installation attempts exit
78, and no host tool is run. Their stable URLs still return readable guidance.
First migration of NVIDIA/Cloud from another OS is unavailable through these
scripts until exact-digest signature enforcement, retained administrative access
and rollback have a separately qualified installation journey.

The unused legacy page entrypoint delegates to the maintained MoOS page, removing
its stale distribution/local-brain copy and separate install commands. No duplicate
layout or package was introduced. Shell artifacts are exercised with stubbed host
tools: old desktop/cloud source invokes conversion commands; corrected scripts
make no calls. Actual native Chromium checks cover Arabic/English at four widths,
absence of conversion commands, the edition-guide links and the mobile guide.
Maintained web typecheck/lint/build and all 99 unit tests, admin checks and
static export passed. Eight native local browser views, language switching,
mobile guidance, actual Worker routes and exact script bytes passed.
[Local receipt](MOOS_INSTALLATION_LOCAL_PROOF.json). Production readback remains
separate until this source is deployed.

The standalone web dependency install also exposed an esbuild override conflict:
its direct dependency is exact 0.28.1, while the old override was a range. The
override now references `$esbuild`, retaining the same pin. Scoped locked CI
installation of web/admin/shared/db succeeds with the repository's npm 11.12.1,
without installing unrelated Windows git dependencies or running install scripts.

Primary references: [bootc signature policy](https://bootc.dev/bootc/man/bootc-install-config.5.html),
[npm direct-dependency overrides](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides),
[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/).
