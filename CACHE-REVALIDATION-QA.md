# Cache and Revalidation QA

Date: 2026-06-15

## Current Behavior

- Public CMS snapshot uses cached remote data tagged with `cms-snapshot`.
- Admin save actions call `revalidateAll`.
- The public revalidation route now revalidates:
  - `cms-snapshot` tag
  - locale layout
  - home, services, work, contact, support
  - app listing and app product pages
  - MoPlayer family, Classic, Pro, PC
  - activate, YouTube, CV
  - privacy, terms, legal, impressum
  - app config and latest download route handlers

## Source Checked

- Next.js `revalidatePath` official docs: https://nextjs.org/docs/app/api-reference/functions/revalidatePath
- Next.js `revalidateTag` official docs: https://nextjs.org/docs/app/api-reference/functions/revalidateTag

Relevant doc assumption:
- `revalidatePath` invalidates a specific path/layout/route handler on demand.
- `revalidateTag` marks tagged cached data stale and should be used with `profile="max"` for modern stale-while-revalidate behavior.

## Tests

| Test | Result | Status |
| --- | --- | --- |
| PC image setting update | public PC and family pages reflected QA image after revalidation | PASS |
| Services/project DB update | public routes reflected changes after revalidation | PASS |
| Restore original DB state | public routes no longer showed QA markers | PASS |
| Route content scan after restore | 24 routes clean | PASS |

Evidence:
- `tmp-admin/qa/pc-public-reflection-result.json`
- `tmp-admin/qa/services-projects-cms-qa.json`
- `tmp-admin/qa/public-route-content-scan.json`

Remaining:
- Production Vercel cache was not tested by deployment in this session. No deployment was performed.
