import type { ReactNode } from "react";
import { TOTAL_LEVELS, levelLabel, pipePaths } from "../lib/puzzle";

/* ------------------------------------------------------------------ bits */

export function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Stars({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span className={`inline-flex gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`${i < count ? "text-amber-300" : "text-slate-700"} transition-colors`}
          fill="currentColor"
          style={{ width: "1em", height: "1em" }}
        >
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </span>
  );
}

function GhostButton({
  children,
  onClick,
  title,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        "flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium",
        "border transition-all duration-200 active:scale-95",
        active
          ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100 shadow-[0_0_20px_-6px_rgba(34,211,238,0.8)]"
          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:bg-white/[0.07] hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- hud */

type HudProps = {
  levelId: number;
  mode: "campaign" | "daily" | "endless";
  moves: number;
  par: number;
  time: number;
  litCount: number;
  total: number;
  coresLit: number;
  coresTotal: number;
  hints: number;
  muted: boolean;
  onHint: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onToggleMute: () => void;
};

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div className="min-w-[64px]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="font-mono text-lg leading-tight text-slate-100 tabular-nums">
        {value}
        {sub && <span className="ml-1 text-xs text-slate-500">{sub}</span>}
      </div>
    </div>
  );
}

export function Hud({
  levelId,
  mode,
  moves,
  par,
  time,
  litCount,
  total,
  coresLit,
  coresTotal,
  hints,
  muted,
  onHint,
  onRestart,
  onMenu,
  onToggleMute,
}: HudProps) {
  const pct = Math.round((litCount / total) * 100);
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3">
            <span className="h-2 w-2 rounded-full bg-cyan-300 flux-blink" />
            <span className="text-sm font-semibold tracking-wide text-cyan-100">
              {mode === "endless"
                ? "ENDLESS"
                : mode === "daily"
                  ? "DAILY"
                  : `LVL ${String(levelId).padStart(2, "0")}`}
            </span>
          </div>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-slate-500 sm:inline">
            {levelLabel(Math.min(levelId, TOTAL_LEVELS * 2))}
          </span>
        </div>

        <div className="flex items-end gap-4 sm:gap-6">
          <Stat label="Moves" value={moves} sub={`/ ${par}`} />
          <Stat label="Time" value={formatTime(time)} />
          <Stat
            label="Cores"
            value={
              <span className={coresLit === coresTotal ? "text-amber-300" : ""}>
                {coresLit}/{coresTotal}
              </span>
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <GhostButton title="Hint (reveals one correct turn)" onClick={onHint} active={hints > 0}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M9 18h6M10 21h4" strokeLinecap="round" />
              <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 2h5.2c0-.8.3-1.5.9-2A6 6 0 0 0 12 3z" strokeLinejoin="round" />
            </svg>
            <span className="font-mono text-xs">{hints}</span>
          </GhostButton>
          <GhostButton title="Restart level" onClick={onRestart}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
              <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </GhostButton>
          <GhostButton title={muted ? "Unmute" : "Mute"} onClick={onToggleMute}>
            {muted ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M11 5 6 9H3v6h3l5 4z" strokeLinejoin="round" />
                <path d="m16 9 5 6M21 9l-5 6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M11 5 6 9H3v6h3l5 4z" strokeLinejoin="round" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
              </svg>
            )}
          </GhostButton>
          <GhostButton title="Level menu" onClick={onMenu}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </GhostButton>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,#0891b2,#22d3ee,#a5f3fc)",
            boxShadow: "0 0 12px rgba(34,211,238,0.7)",
          }}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- overlay */

export function SparkBurst() {
  const sparks = Array.from({ length: 22 }, (_, i) => {
    const angle = (i / 22) * Math.PI * 2 + (i % 3) * 0.2;
    const dist = 90 + ((i * 37) % 110);
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      delay: (i % 7) * 0.05,
      hue: i % 2 ? "var(--spark-2)" : "var(--spark-1)",
    };
  });
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {sparks.map((s, i) => (
        <span
          key={i}
          className="flux-spark absolute h-1.5 w-1.5 rounded-full"
          style={
            {
              "--tx": `${s.x}px`,
              "--ty": `${s.y}px`,
              background: s.hue,
              animationDelay: `${s.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ home */

function SpinnerTile({ mask, delay, dur }: { mask: number; delay: number; dur: number }) {
  const paths = pipePaths(mask);
  return (
    <div className="relative h-14 w-14 sm:h-16 sm:w-16">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <g
          className="flux-spin"
          style={{ animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
        >
          {paths.map((d, i) => (
            <path key={`c${i}`} d={d} fill="none" stroke="#132033" strokeWidth={24} strokeLinecap="round" />
          ))}
          {paths.map((d, i) => (
            <path
              key={`p${i}`}
              d={d}
              fill="none"
              stroke="#3ee9ff"
              strokeWidth={11}
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.9))" }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function HomeScreen({
  unlocked,
  endlessBest,
  totalStars,
  onContinue,
  onLevels,
  onDaily,
  onEndless,
  onHowTo,
  installSlot,
  onPublish,
}: {
  unlocked: number;
  endlessBest: number;
  totalStars: number;
  onContinue: () => void;
  onLevels: () => void;
  onDaily: () => void;
  onEndless: () => void;
  onHowTo: () => void;
  installSlot?: ReactNode;
  onPublish: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <SpinnerTile mask={1 | 4} delay={0} dur={9} />
        <SpinnerTile mask={1 | 2} delay={-1.2} dur={7} />
        <SpinnerTile mask={2 | 4} delay={-2.4} dur={11} />
        <SpinnerTile mask={4 | 8} delay={-0.6} dur={8} />
        <SpinnerTile mask={8 | 1} delay={-3.1} dur={10} />
      </div>

      <div>
        <h1 className="flux-title text-6xl font-black tracking-[0.22em] sm:text-7xl">
          FLUX
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.34em] text-cyan-200/70">
          complete the circuit
        </p>
      </div>

      <p className="max-w-md text-balance text-[15px] leading-relaxed text-slate-400">
        Rotate the conduits to route energy from the reactor to every dormant core.
        Solve it in the target number of turns to earn a perfect rating.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {installSlot}
        <button
          type="button"
          onClick={onContinue}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-4 text-base font-bold tracking-wide text-slate-950 shadow-[0_0_38px_-8px_rgba(34,211,238,0.9)] transition-transform active:scale-[0.97]"
        >
          <span className="relative z-10">
            {unlocked > 1 ? `CONTINUE · LEVEL ${Math.min(unlocked, TOTAL_LEVELS)}` : "START PLAYING"}
          </span>
          <span className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-full" />
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onLevels}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-white active:scale-95"
          >
            Levels
          </button>
          <button
            type="button"
            onClick={onHowTo}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-white active:scale-95"
          >
            How to play
          </button>
        </div>
        <button
          type="button"
          onClick={onDaily}
          className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 transition-all hover:border-amber-300/50 hover:bg-amber-500/20 active:scale-95"
        >
          Daily challenge
        </button>
        <button
          type="button"
          onClick={onEndless}
          className="rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-200 transition-all hover:border-violet-300/50 hover:bg-violet-500/20 active:scale-95"
        >
          Endless mode {endlessBest > 0 && <span className="font-mono">· best {endlessBest}</span>}
        </button>
      </div>

      <div className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-slate-500">
        <span>
          <span className="font-mono text-amber-300">{totalStars}</span>/{TOTAL_LEVELS * 3} ★
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span>
          <span className="font-mono text-cyan-300">{Math.min(unlocked - 1, TOTAL_LEVELS)}</span>/{TOTAL_LEVELS} solved
        </span>
      </div>

      <button
        type="button"
        onClick={onPublish}
        className="text-[10px] uppercase tracking-[0.24em] text-slate-600 underline decoration-slate-700 underline-offset-4 transition hover:text-cyan-300 hover:decoration-cyan-400/60"
      >
        📱 publish to google play
      </button>
    </div>
  );
}

/* ---------------------------------------------------------- level select */

export function LevelSelect({
  unlocked,
  stars,
  onPick,
  onBack,
  onDaily,
  onEndless,
}: {
  unlocked: number;
  stars: Record<number, number>;
  onPick: (id: number) => void;
  onBack: () => void;
  onDaily: () => void;
  onEndless: () => void;
}) {
  const done = TOTAL_LEVELS;
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white">Select level</h2>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.08] hover:text-white active:scale-95"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {Array.from({ length: done }, (_, i) => i + 1).map((id) => {
          const locked = id > unlocked;
          const s = stars[id] ?? 0;
          return (
            <button
              key={id}
              type="button"
              disabled={locked}
              onClick={() => onPick(id)}
              className={[
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border transition-all",
                locked
                  ? "cursor-not-allowed border-white/5 bg-white/[0.015] text-slate-700"
                  : s > 0
                    ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100 hover:scale-[1.04] hover:border-cyan-300/60 hover:bg-cyan-400/20 active:scale-95"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:scale-[1.04] hover:border-cyan-300/40 hover:bg-cyan-400/10 active:scale-95",
              ].join(" ")}
            >
              <span className="font-mono text-lg font-bold">{id}</span>
              {locked ? (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              ) : (
                <Stars count={s} className="text-[11px]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onDaily}
          className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 transition-all hover:border-amber-300/50 hover:bg-amber-500/20 active:scale-95"
        >
          ✦ Daily challenge
        </button>
        <button
          type="button"
          onClick={onEndless}
          className="rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-200 transition-all hover:border-violet-300/50 hover:bg-violet-500/20 active:scale-95"
        >
          ♾ Endless mode
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- how to */

export function HowTo({ onClose }: { onClose: () => void }) {
  const Row = ({ icon, title, body }: { icon: ReactNode; title: string; body: string }) => (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-200">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        <div className="mt-0.5 text-sm leading-relaxed text-slate-400">{body}</div>
      </div>
    </div>
  );
  return (
    <div className="w-full max-w-md space-y-5">
      <h2 className="text-2xl font-bold tracking-tight text-white">How to play</h2>
      <Row
        icon={<span className="text-lg">👆</span>}
        title="Tap a tile to rotate it"
        body="Each turn rotates the conduits a quarter turn clockwise. You can also select with arrow keys and rotate with space."
      />
      <Row
        icon={<span className="text-lg">⚡</span>}
        title="Follow the energy"
        body="Glowing cyan pipes carry power from the reactor. Power only crosses a seam when both tiles point at each other."
      />
      <Row
        icon={<span className="text-lg">🔶</span>}
        title="Wake every core"
        body="Route power to all amber cores to clear the level. Fill the entire grid for a flawless run."
      />
      <Row
        icon={<span className="text-lg">★</span>}
        title="Chase perfection"
        body="Match the target number of turns for three stars. Hints solve one tile but cost rating stars."
      />
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3 text-sm font-bold text-slate-950 transition active:scale-95"
      >
        Got it
      </button>
    </div>
  );
}
