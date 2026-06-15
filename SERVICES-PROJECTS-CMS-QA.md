# Services and Projects CMS QA

Date: 2026-06-15

## Reversible Tests

Evidence file: `tmp-admin/qa/services-projects-cms-qa.json`

Services:
1. Changed an existing service title to a QA marker.
2. Revalidated CMS.
3. Confirmed the marker appeared on `/en/services`.
4. Hid that service.
5. Revalidated CMS.
6. Confirmed the marker disappeared.
7. Added a temporary QA service with managed media.
8. Confirmed it appeared.
9. Deleted QA service and restored the original service.

Projects:
1. Changed an existing project title and description to a QA marker.
2. Changed the project cover media to a managed media asset.
3. Revalidated CMS.
4. Confirmed the title appeared on `/en/work`.
5. Confirmed the managed image reference appeared on `/en/work`.
6. Hid the project.
7. Confirmed the marker disappeared.
8. Added a temporary QA project.
9. Confirmed it appeared.
10. Deleted QA project and restored the original project.

## Results

| Item | Result | Status |
| --- | --- | --- |
| Change service name | reflected on public route | PASS |
| Hide service | removed from public route | PASS |
| Add service | reflected on public route | PASS |
| Change service image | public route used managed media | PASS |
| Change project title/description | reflected on public route | PASS |
| Change project image | public route used managed media | PASS |
| Hide project | removed from public route | PASS |
| Add project | reflected on public route | PASS |
| Restore originals | QA markers absent after restore | PASS |

No QA service or project was left behind.
