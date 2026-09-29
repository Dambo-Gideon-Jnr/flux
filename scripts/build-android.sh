#!/usr/bin/env bash
#
# Build an Android App Bundle for FLUX from the deployed PWA manifest.
#
#   bash scripts/build-android.sh https://your-domain.com
#
# Prereqs: Node 18+, Java 11+, and `npm install -g @bubblewrap/cli`.
# The first run downloads the Android SDK / JDK build tools for you.

set -euo pipefail

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "usage: bash scripts/build-android.sh https://YOUR-DOMAIN" >&2
  exit 1
fi
# normalise: no trailing slash, force https
DOMAIN="${DOMAIN%/}"
DOMAIN="${DOMAIN/#http:/https:}"
MANIFEST="$DOMAIN/manifest.webmanifest"

echo "▸ target manifest : $MANIFEST"

if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "▸ installing @bubblewrap/cli globally"
  npm install -g @bubblewrap/cli
fi

echo "▸ building the web bundle"
npm run build

echo "▸ initialising the Android project from the live manifest"
bubblewrap init --manifest="$MANIFEST"

echo "▸ building app-release-bundle.aab"
bubblewrap build

echo "▸ generating the Digital Asset Links statement"
bubblewrap digitalassetlinks create --manifest="$MANIFEST" > assetlinks.json 2>/dev/null || true

cat <<EOF

──────────────────────────────────────────────────────────────────────
Done.

  1. Upload  app-release-bundle.aab  to Play Console → Production
  2. Serve   assetlinks.json  at      $DOMAIN/.well-known/assetlinks.json
     (Content-Type: application/json, no redirects, HTTPS only)
  3. Store listing assets: public/icons/icon-512.png (512×512)
     plus a 1024×500 feature graphic and phone screenshots.

Sign-in to Play Console: https://play.google.com/console
──────────────────────────────────────────────────────────────────────
EOF
