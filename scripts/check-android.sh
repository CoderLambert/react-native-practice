#!/usr/bin/env bash
# Read-only diagnostic. Does not change shells, install packages or alter KVM permissions.
set -u
fail=0
check() { if command -v "$1" >/dev/null 2>&1; then printf 'OK   %s\n' "$1"; else printf 'MISS %s\n' "$1"; fail=1; fi; }
check node
check pnpm
check java
check adb
if command -v node >/dev/null; then node -v; fi
if command -v java >/dev/null; then java -version; fi
if [ -n "${ANDROID_HOME:-}" ] && [ -d "$ANDROID_HOME/platform-tools" ]; then
  printf 'OK   ANDROID_HOME=%s\n' "$ANDROID_HOME"
else
  printf 'MISS Android SDK. Set ANDROID_HOME to the SDK location shown in Android Studio.\n'; fail=1
fi
if [ -r /dev/kvm ] && [ -w /dev/kvm ]; then printf 'OK   KVM acceleration access\n';
else printf 'INFO KVM access unavailable; USB physical-device testing still works.\n'; fi
if command -v adb >/dev/null; then adb devices; fi
printf '\nNext: pnpm android  (with an emulator running or a USB device authorized)\n'
exit "$fail"
