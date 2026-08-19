#!/usr/bin/env bash
# =============================================================================
#  MoOS — official installer (public desktop edition)
#  https://moalfarras.space/moos
#
#  Switches an existing Fedora Atomic (Kinoite / Silverblue) machine to MoOS.
#  The signed image is pulled from GHCR and verified with cosign BEFORE the
#  switch, and the current deployment is pinned so you can always roll back.
#
#  Usage:
#     chmod +x moos-install.sh
#     sudo ./moos-install.sh              # generic / AMD / Intel / Nouveau
#     sudo ./moos-install.sh --nvidia     # modern NVIDIA GPU (open driver)
# =============================================================================
set -euo pipefail

IMAGE_BASE="ghcr.io/moalfarras-sys/moos"
COSIGN_KEY="https://raw.githubusercontent.com/moalfarras-sys/moos-image/main/cosign.pub"
IMAGE="${IMAGE_BASE}:latest"
EDITION="desktop"

for arg in "$@"; do
  case "$arg" in
    --nvidia) IMAGE="${IMAGE_BASE}-nvidia:latest"; EDITION="desktop (NVIDIA)" ;;
    -h|--help) sed -n '2,17p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

say()  { printf '\n\033[1;36m==>\033[0m \033[1m%s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m warning:\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31m error:\033[0m %s\n\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run this installer as root:  sudo ./moos-install.sh"

say "MoOS installer — ${EDITION}"
echo "    image: ${IMAGE}"

command -v bootc >/dev/null 2>&1 || die \
"'bootc' was not found.
   MoOS installs on top of a Fedora Atomic system (Kinoite or Silverblue).
   On a plain Fedora server, install the bootc tooling first:
       sudo dnf install -y bootc
   To convert a running non-atomic Fedora instead, use the MoOS Cloud
   installer:  https://moalfarras.space/downloads/moos/moos-cloud-install.sh"

# ---- 1. Verify the signature before trusting the image ----------------------
say "Verifying the image signature (cosign)"
if command -v cosign >/dev/null 2>&1; then
  if cosign verify --key "$COSIGN_KEY" "$IMAGE" >/dev/null 2>&1; then
    echo "    signature OK — image is genuinely published by MoOS."
  else
    die "Signature verification FAILED for ${IMAGE}. Nothing was changed."
  fi
else
  warn "cosign is not installed, so the signature could not be checked here."
  warn "The installed system still enforces signature policy on every update."
  printf '    Continue without a local check? [y/N] '
  read -r reply </dev/tty || reply=""
  case "$reply" in [yY]*) ;; *) die "Aborted. Install cosign with:  sudo dnf install -y cosign" ;; esac
fi

# ---- 2. Pin the current deployment so rollback always works -----------------
say "Pinning your current system (so you can always go back)"
if command -v ostree >/dev/null 2>&1; then
  ostree admin pin 0 >/dev/null 2>&1 && echo "    current deployment pinned." \
    || warn "could not pin the current deployment; rollback via GRUB still works."
fi

# ---- 3. Switch ---------------------------------------------------------------
say "Switching this machine to MoOS"
echo "    This downloads the image and stages it as the next boot."
bootc switch "$IMAGE"

cat <<EOF

  ╭──────────────────────────────────────────────────────────────╮
  │  MoOS is staged and will start on the next boot.             │
  ╰──────────────────────────────────────────────────────────────╯

  Reboot now:            sudo systemctl reboot
  Update later:          moai-do update
  Roll back any time:    sudo bootc rollback && sudo systemctl reboot
                         (or pick the previous entry in the GRUB menu)

  Docs and support:      https://moalfarras.space/moos

EOF
