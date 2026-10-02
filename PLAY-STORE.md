# Shipping FLUX to Google Play

Short answer: **the app itself can't be uploaded from here.** Publishing to Google Play
requires (a) a Google Play Console developer account — a one-time **$25** fee, (b) a
cryptographically signed **Android App Bundle (`.aab`)**, and (c) passing Google's
review. Those steps need your accounts, your keys and your click.

Everything that *can* be prepared without that is now done. FLUX is a fully
installable **PWA**:

| Requirement | Status |
| --- | --- |
| Web app manifest (`display: standalone`, name, icons) | ✅ `public/manifest.webmanifest` |
| 192 / 512 px icons + maskable variants | ✅ `public/icons/` |
| Apple touch icon + iOS meta tags | ✅ |
| Offline play (service worker, cached shell) | ✅ `public/sw.js` |
| App shortcuts (Play / Endless) | ✅ manifest `shortcuts` |
| Safe-area insets, no zoom, no text-selection on taps | ✅ |
| Deep links `?screen=game`, `?mode=endless`, `?level=7` | ✅ |

Because the whole game is one inlined `dist/index.html` (plus the icon/manifest/SW
files), the app is ~260 KB total and every level generates on-device — so offline play
is genuinely complete, not a stub.

---

## Route 0 — install today, no store (recommended first)

Open the deployed URL on Android or desktop Chrome and tap **Install as app**
(or Chrome's own install icon). Android generates a **WebAPK**: real home-screen icon,
splash screen, app-drawer entry, standalone window, offline behaviour — indistinguishable
from a store app for a puzzle game. iOS: Share → *Add to Home Screen*.

---

## Route 1 — Trusted Web Activity via Bubblewrap (fastest store path)

Keeps the app tiny (< 2 MB) and reuses the live site. Requires the site to be on a
public **HTTPS** URL you control.

```bash
# 1. deploy the build
npm run build
npx vercel deploy --prod        # or netlify / gh-pages / S3 + CloudFront

# 2. install bubblewrap (needs Java 11+ / Android SDK, it will offer to download it)
npm install -g @bubblewrap/cli

# 3. generate the Android project straight from the live manifest
bubblewrap init --manifest https://YOUR-DOMAIN/manifest.webmanifest

# 4. build the bundle  ->  app-release-bundle.aab  (+ signing key)
bubblewrap build
```

Then in [Play Console](https://play.google.com/console):

1. **Create app** → name `FLUX · Circuit Puzzle`, type *Game*, free.
2. Set the package name, e.g. `com.yourstudio.flux`.
3. Complete **App content**: content rating questionnaire, ads = none,
   data safety (the game collects nothing; progress lives in `localStorage` on-device),
   privacy policy URL (required — even a single static page works).
4. **Production → Create new release** → upload `app-release-bundle.aab`.
5. Add store listing assets: 512×512 icon (already in `public/icons/icon-512.png`),
   1024×500 feature graphic, phone screenshots (use the installed app at 1080×1920).
6. Submit for review — first-time review is typically 1–3 days.

### Remove the URL bar

Without verification, a TWA shows a small Chrome address bar. Publish the
Digital Asset Links file at exactly this path:

```bash
bubblewrap digitalassetlinks create \
  --manifest=https://YOUR-DOMAIN/manifest.webmanifest
# upload the printed statement to:
#   https://YOUR-DOMAIN/.well-known/assetlinks.json
```

`assetlinks.json` must be served over HTTPS with no redirects and `Content-Type:
application/json`. After uploading, run `bubblewrap validate` or use
<https://developers.google.com/digital-asset-links/tools/generator> to confirm, then
reinstall/reopen the app.

### Update flow

Bump `CACHE` in `public/sw.js` whenever you ship a new build so installed clients pick
it up, and bump `versionCode`/`versionName` in `twap-manifest.json` for a store release.

---

## Route 2 — Capacitor (native shell)

Use this if you want Play Games Services (achievements/leaderboards), haptics,
interstitials, or to bundle the game so it works with no server at all.

```bash
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init FLUX com.yourstudio.flux --web-dir=dist
npx cap add android
npx cap sync
npx cap open android     # Android Studio → Build → Generate Signed Bundle (.aab)
```

With Capacitor the web build is bundled inside the APK, so the site never needs to be
public. Remember to strip the service-worker registration (it's pointless in the
webview) by guarding it, e.g. `if (!window.Capacitor)`.

---

## One-shot helper

```bash
bash scripts/build-android.sh https://YOUR-DOMAIN
```

Runs the Bubblewrap init/build and digital-asset-links steps for you.

---

## Store listing copy you can paste

> **FLUX · Circuit Puzzle**
>
> Twist the conduits. Light up the grid.
>
> FLUX is a minimal neon puzzle about completing a circuit. Every tile is a piece of
> pipe — tap it and it rotates a quarter turn. Energy flows from the reactor through
> every joint where two conduits meet, and your job is to route that power to every
> dormant core on the board.
>
> • 50 progressively scaled campaign levels, from a gentle 3×3 warm-up to a 7×8 master board
> • Endless mode with infinite randomized, guaranteed-solvable circuit layouts
> • Three-star ratings against an optimal turn target
> • Hints, timers and best-move records
> • Plays entirely offline, no account, no ads, no tracking
> • One-hand friendly, keyboard playable, dark by design
