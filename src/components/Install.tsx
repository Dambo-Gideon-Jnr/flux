import { useCallback, useEffect, useState, type ReactNode } from "react";

/* --------------------------------------------------------- install prompt */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) setInstalled(true);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
    return outcome;
  }, [deferred]);

  return { canInstall: Boolean(deferred) && !installed, installed, isIOS, install };
}

export function InstallButton({
  onInstall,
  className = "",
}: {
  onInstall: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onInstall}
      className={[
        "flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/30",
        "bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition-all",
        "hover:border-emerald-300/60 hover:bg-emerald-400/20 active:scale-95",
        className,
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9}>
        <path d="M12 3v12" strokeLinecap="round" />
        <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 20h16" strokeLinecap="round" />
      </svg>
      Install as app
    </button>
  );
}

export function IosInstallHint() {
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Install on iPhone / iPad
      </div>
      <ol className="mt-2 space-y-1 text-sm text-slate-400">
        <li>
          1. Tap <span className="text-slate-200">Share</span> in Safari
        </li>
        <li>
          2. Choose <span className="text-slate-200">Add to Home Screen</span>
        </li>
        <li>3. Launch FLUX from your home screen — it runs fullscreen and offline</li>
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------ code block */

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(children).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          },
          () => undefined,
        );
      }}
      className="group relative block w-full overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-3 text-left font-mono text-[11.5px] leading-relaxed text-cyan-200/90 transition hover:border-cyan-300/30"
    >
      <pre className="whitespace-pre">{children}</pre>
      <span className="absolute right-2 top-2 rounded-md bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-slate-400 opacity-0 transition group-hover:opacity-100">
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-400/10 font-mono text-[11px] text-cyan-200">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        <div className="mt-1 space-y-2 text-sm leading-relaxed text-slate-400">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------ play store guide */

export function PlayStoreModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-md flux-fade"
      onClick={onClose}
    >
      <div
        className="flux-rise relative my-auto w-full max-w-lg rounded-3xl border border-cyan-300/20 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-6 shadow-[0_0_60px_-18px_rgba(34,211,238,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg px-2 py-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
          distribution
        </div>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
          Shipping to Google Play
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Publishing to the Play Store needs a Google Play Console account, a signed{" "}
          <span className="font-mono text-slate-300">.aab</span> and Google&apos;s review — none of
          which can be done from here. Everything that <em>can</em> be prepared is already done:
          FLUX is now an installable, offline-capable app with icons, manifest, standalone display
          and touch-first layout.
        </p>

        <div className="mt-5 space-y-5">
          <Step n="0" title="Install it today (no store required)">
            <p>
              On Android or desktop, hit <span className="text-emerald-300">Install as app</span> on
              the menu. Android wraps it in a WebAPK — real icon, splash screen, app drawer entry,
              no browser UI, works offline.
            </p>
          </Step>

          <Step n="1" title="Put the build on a public HTTPS URL">
            <p>
              A Trusted Web Activity needs one stable URL. The build output is a single{" "}
              <span className="font-mono text-slate-300">dist/index.html</span> plus the{" "}
              <span className="font-mono text-slate-300">icons/</span>,{" "}
              <span className="font-mono text-slate-300">manifest.webmanifest</span> and{" "}
              <span className="font-mono text-slate-300">sw.js</span> files.
            </p>
            <Code>{`# any static host works
npx vercel deploy --prod      # or
npx netlify deploy --prod     # or
npx gh-pages -d dist`}</Code>
          </Step>

          <Step n="2" title="Wrap it as an Android App Bundle (TWA)">
            <p>
              Bubblewrap reads the manifest and produces a signed{" "}
              <span className="font-mono text-slate-300">.aab</span>. This is the fastest route and
              keeps the app under ~2 MB.
            </p>
            <Code>{`npm install -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR-DOMAIN/manifest.webmanifest
bubblewrap build        # -> app-release-bundle.aab`}</Code>
          </Step>

          <Step n="3" title="Verify ownership (removes the URL bar)">
            <p>
              Publish the Digital Asset Links file so Android trusts the domain — otherwise a small
              Chrome toolbar appears inside the app.
            </p>
            <Code>{`bubblewrap digitalassetlinks create \\
  --manifest=https://YOUR-DOMAIN/manifest.webmanifest
# upload the output to
# https://YOUR-DOMAIN/.well-known/assetlinks.json`}</Code>
          </Step>

          <Step n="4" title="Upload to Play Console">
            <p>
              Create the app, complete the content-rating questionnaire and data-safety form, upload
              the <span className="font-mono text-slate-300">.aab</span>, add a 512×512 icon plus a
              1024×500 feature graphic and screenshots, then submit for review.
            </p>
            <Code>{`package name   com.yourstudio.flux
app name       FLUX · Circuit Puzzle
category       Puzzle
content rating Everyone
asset group    16 KB / Android 15+`}</Code>
          </Step>

          <Step n="5" title="Need native features? Use Capacitor instead">
            <p>
              If you later want Play Games services, leaderboards, haptics or fullscreen ads, wrap
              the same build in a native shell.
            </p>
            <Code>{`npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init FLUX com.yourstudio.flux --web-dir=dist
npx cap add android && npx cap sync
npx cap open android   # Build > Generate Signed Bundle`}</Code>
          </Step>
        </div>

        <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-500">
          Full walkthrough with troubleshooting lives in{" "}
          <span className="font-mono text-slate-400">PLAY-STORE.md</span> at the project root, and{" "}
          <span className="font-mono text-slate-400">scripts/build-android.sh</span> runs steps 2–3
          for you once the URL is set.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3 text-sm font-bold text-slate-950 transition active:scale-95"
        >
          Back to the game
        </button>
      </div>
    </div>
  );
}
