# Mira images on the MoOS page

The MoOS page uses four real window captures of the installed Mira application,
not generated illustrations or the retired Mo AI QML window. Each locale shows
the holographic and rose faces that ship in Mira, with links to the full images.

The captures were taken on 2026-10-08 from `/usr/lib/mira/app` in signed MoOS ARM
`44.20261006.724`, source `fa85b2daf3db0f1f823b3159bb46b25571a99740`.
The installed `app.py`, `qml/Main.qml` and `faces.json` SHA-256 values were
compared with that exact release source and matched. Mira's own capture path
saved the window at 1480 × 920, using the shipped software rendering path.

Capture isolation used a private mounted home, cleared environment, private
runtime/socket and disabled network. `MIRA_TEST_MODE=1`, `--scene=idle` and
`--empty` supplied illustrative interface data without owner conversations,
credentials, recordings or device actions. The page caption identifies this
demo data. These pictures prove the real interface and original faces, not a
successful voice, home-device or agent operation.

| Public image | Language | Face | WebP bytes |
| --- | --- | --- | --- |
| `/images/moos/mira-holo-ar.webp` | Arabic | Holographic | 55,368 |
| `/images/moos/mira-rose-ar.webp` | Arabic | Rose | 58,916 |
| `/images/moos/mira-holo-en.webp` | English | Holographic | 60,104 |
| `/images/moos/mira-rose-en.webp` | English | Rose | 63,474 |

WebP encoding preserves the full captured frame. Next Image handles responsive
delivery; the containing link opens the complete image. Raw captures and browser
QA evidence stay outside Git. These four public files are product assets requested
by the owner, rather than local QA dumps. The old tracked Mo AI asset remains for
historical consumers, with no reference from the current MoOS page.

Feature text was checked against the shipped controller, chat UI, tools, pages
and source README: Arabic/English chat and attachments, configured voice,
computer actions, Home Assistant/Lumen, research/reminders/Workbench, approval
controls and opt-in screen viewing. Cloud/provider and device configuration
requirements remain visible. No local-model or universal device-support claim
is made. ISO availability comes from the qualified release manifest; completed
hosting no longer appears in its pending-work list.

Current image handling reference:
[Next Image](https://nextjs.org/docs/app/api-reference/components/image).
