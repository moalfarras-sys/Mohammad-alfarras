#!/usr/bin/env bash
# =============================================================================
#  MoOS Cloud — official installer (24/7 server edition)
#  https://moalfarras.space/moos
#
#  Converts a running Fedora server (any VPS: Hetzner, Contabo, OVH, Vultr,
#  Oracle …) into MoOS Cloud. Your SSH keys are preserved by
#  system-reinstall-bootc — without them you would lock yourself out.
#
#  Usage, on the server:
#     chmod +x moos-cloud-install.sh
#     sudo ./moos-cloud-install.sh
# =============================================================================
set -euo pipefail

IMAGE="ghcr.io/moalfarras-sys/moos-cloud:latest"
COSIGN_KEY="https://raw.githubusercontent.com/moalfarras-sys/moos-image/main/cosign.pub"

say()  { printf '\n\033[1;36m==>\033[0m \033[1m%s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m warning:\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31m error:\033[0m %s\n\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run this installer as root:  sudo ./moos-cloud-install.sh"

say "MoOS Cloud installer"
echo "    image: ${IMAGE}"
echo "    host:  $(hostname)"

command -v dnf >/dev/null 2>&1 || die \
"This installer expects a Fedora server (dnf was not found).
   Reinstall the VPS with Fedora from your provider's panel, then run it again."

# ---- 0. Make sure we will not lock the operator out -------------------------
if [ ! -s /root/.ssh/authorized_keys ] && [ -z "$(ls -A /home/*/.ssh/authorized_keys 2>/dev/null || true)" ]; then
  warn "No SSH authorized_keys found on this server."
  warn "system-reinstall-bootc preserves existing keys, but it cannot create one."
  warn "If you only log in with a password, add an SSH key FIRST — otherwise you"
  warn "may lose access to this server after the reboot."
  printf '    Continue anyway? [y/N] '
  read -r reply </dev/tty || reply=""
  case "$reply" in [yY]*) ;; *) die "Aborted — nothing was changed." ;; esac
fi

# ---- 1. Tooling --------------------------------------------------------------
say "Installing the bootc conversion tool"
dnf install -y system-reinstall-bootc >/dev/null
echo "    system-reinstall-bootc ready."

# ---- 2. Verify the signature before trusting the image ----------------------
say "Verifying the image signature (cosign)"
if ! command -v cosign >/dev/null 2>&1; then
  dnf install -y cosign >/dev/null 2>&1 || true
fi
if command -v cosign >/dev/null 2>&1; then
  if cosign verify --key "$COSIGN_KEY" "$IMAGE" >/dev/null 2>&1; then
    echo "    signature OK — image is genuinely published by MoOS."
  else
    die "Signature verification FAILED for ${IMAGE}. Nothing was changed."
  fi
else
  warn "cosign unavailable; skipping the local check."
  warn "The installed system still enforces signature policy on every update."
fi

# ---- 3. Convert --------------------------------------------------------------
say "Converting this server to MoOS Cloud"
echo "    Existing SSH keys are carried over. This can take a few minutes."
system-reinstall-bootc "$IMAGE"

cat <<EOF

  ╭──────────────────────────────────────────────────────────────╮
  │  MoOS Cloud is installed and will start on the next boot.    │
  ╰──────────────────────────────────────────────────────────────╯

  Reboot now:            sudo reboot
  Reconnect over SSH with the same key you use today.

  Update later:          sudo bootc upgrade && sudo reboot
  Roll back any time:    sudo bootc rollback && sudo reboot

  Docs and support:      https://moalfarras.space/moos

EOF
