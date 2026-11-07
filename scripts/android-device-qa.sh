#!/usr/bin/env bash
# CI-only emulator lifecycle. Boot completion precedes input/package service readiness.
set -euo pipefail
api="${1:?API level required}"
target="${2:?System image target required}"
device="${3:?Device profile required}"
product="${4:-pro}"
case "$product" in
  pro) connected_task=connectedDebugAndroidTest ;;
  classic) connected_task=connectedSideloadDebugAndroidTest ;;
  *) echo "Unsupported Android product: $product" >&2; exit 2 ;;
esac
sdk="${ANDROID_HOME:?ANDROID_HOME required}"
image="system-images;android-${api};${target};x86_64"
serial=emulator-5554
name="${product}-qa-${api}"
log="${RUNNER_TEMP:-/tmp}/${product}-emulator-${api}.log"
# avdmanager and emulator can otherwise choose different XDG/legacy Android homes.
export ANDROID_AVD_HOME="${RUNNER_TEMP:-/tmp}/${product}-qa-avds"
mkdir -p "$ANDROID_AVD_HOME"

"$sdk/cmdline-tools/latest/bin/sdkmanager" emulator "$image"
echo no | "$sdk/cmdline-tools/latest/bin/avdmanager" create avd --force --name "$name" --package "$image" --device "$device" --path "$ANDROID_AVD_HOME/$name.avd"
"$sdk/platform-tools/adb" start-server
"$sdk/emulator/emulator" -avd "$name" -port 5554 -no-window -gpu swiftshader -no-snapshot -noaudio -no-boot-anim -camera-back none -memory 2048 > "$log" 2>&1 &
emulator_pid=$!
cleanup() {
  "$sdk/platform-tools/adb" -s "$serial" emu kill >/dev/null 2>&1 || true
  kill "$emulator_pid" >/dev/null 2>&1 || true
  tail -60 "$log"
}
trap cleanup EXIT

# SettingsProvider can still reject writes just after boot/input become ready.
# Keep these writes inside the bounded readiness loop, rather than exiting 255.
disable_animations() {
  for setting in window_animation_scale transition_animation_scale animator_duration_scale; do
    "$sdk/platform-tools/adb" -s "$serial" shell settings put global "$setting" 0 >/dev/null 2>&1 || return 1
  done
}
ready=false
for ((attempt=0; attempt<180; attempt++)); do
  if ! kill -0 "$emulator_pid" 2>/dev/null; then
    echo 'Emulator exited before becoming ready.' >&2
    exit 1
  fi
  boot="$("$sdk/platform-tools/adb" -s "$serial" shell getprop sys.boot_completed 2>/dev/null || true)"
  if [[ "${boot//$'\r'/}" == 1 ]] &&
     "$sdk/platform-tools/adb" -s "$serial" shell pm path android >/dev/null 2>&1 &&
     "$sdk/platform-tools/adb" -s "$serial" shell input keyevent 82 >/dev/null 2>&1 &&
     disable_animations; then
    ready=true
    break
  fi
  sleep 2
done
if [[ "$ready" != true ]]; then
  echo 'Timed out waiting for boot, package manager, input and settings services.' >&2
  exit 1
fi
ANDROID_SERIAL="$serial" node scripts/run-gradle.mjs "$product" "$connected_task" --max-workers=2
