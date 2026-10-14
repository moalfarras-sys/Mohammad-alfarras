#!/usr/bin/env bash
# MoOS installation guidance. This retired conversion entrypoint changes nothing.
set -euo pipefail
cat <<'GUIDE'
MoOS — خيارات التثبيت / Installation options

التثبيت الجديد: استخدم ملف ISO المتحقق منه لنسخة المكتب، أو دليل نسختك:
New installation: use the verified desktop ISO or your edition's guide:
https://moos-site.moalfarras-moos.workers.dev/downloads/moos/installation.html

على جهاز MoOS مثبت: الإعدادات ← التحديثات، أو شغّل moai-do update.
On an existing MoOS computer: System Settings → Updates, or run moai-do update.

لم يتغير أي شيء في جهازك. / Nothing on this computer was changed.
GUIDE
if [[ $# == 1 && ( $1 == --help || $1 == -h ) ]]; then exit 0; fi
exit 78
