import { useEffect, useRef, useState } from "react";
import { Stars, SparkBurst, formatTime } from "./Panels";

const AUTO_ADVANCE_MS = 5000;
import type { Level } from "../lib/puzzle";

type Props = {
  level: Level;
  moves: number;
  time: number;
  stars: number;
  flawless: boolean;
  endlessRound: number | null;
  mode: "campaign" | "daily" | "endless";
  isLast: boolean;
  onNext: () => void;
  onReplay: () => void;
  onMenu: () => void;
};

export function WinOverlay({
  level,
  moves,
  time,
  stars,
  flawless,
  endlessRound,
  mode,
  isLast,
  onNext,
  onReplay,
  onMenu,
}: Props) {
  const over = moves > level.par;
  const [paused, setPaused] = useState(false);
  const [left, setLeft] = useState(AUTO_ADVANCE_MS);
  const nextRef = useRef(onNext);
  const advanced = useRef(false);
  nextRef.current = onNext;

  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const startLeft = left;
    const t = window.setInterval(() => {
      const remaining = startLeft - (Date.now() - started);
      if (remaining <= 0) {
        window.clearInterval(t);
        setLeft(0);
        if (!advanced.current) {
          advanced.current = true;
          nextRef.current();
        }
      } else {
        setLeft(remaining);
      }
    }, 50);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md flux-fade">
      <SparkBurst />
      <div className="flux-rise relative w-full max-w-sm rounded-3xl border border-cyan-300/20 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-6 text-center shadow-[0_0_60px_-18px_rgba(34,211,238,0.8)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
          {endlessRound !== null
            ? `Round ${endlessRound} cleared`
            : mode === "daily"
              ? `Daily challenge cleared`
              : `Level ${level.id} cleared`}
        </div>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
          {flawless ? "FLAWLESS" : "SYSTEM ONLINE"}
        </h2>

        <div className="mt-4 text-4xl">
          <Stars count={stars} className="flux-pop" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Moves", value: String(moves) },
            { label: "Target", value: String(level.par) },
            { label: "Time", value: formatTime(time) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] py-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{s.label}</div>
              <div className="font-mono text-lg text-slate-100">{s.value}</div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-400">
          {flawless
            ? "Every conduit in the grid is perfectly aligned. Outstanding."
            : over
              ? "Circuit restored — try matching the target turn count for a perfect rating."
              : "Efficient routing. The grid still has a few idle conduits."}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (advanced.current) return;
              advanced.current = true;
              onNext();
            }}
            className="rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_0_30px_-8px_rgba(34,211,238,0.9)] transition active:scale-95"
          >
            {mode === "daily"
              ? "Fresh daily board →"
              : isLast
                ? "Enter endless mode →"
                : "Next level →"}
            {!paused && <span className="ml-1 font-mono">({Math.ceil(left / 1000)})</span>}
          </button>
          <p className="text-xs text-slate-500" aria-live="polite">
            {paused
              ? "Auto-advance paused"
              : `Moving on automatically in ${Math.ceil(left / 1000)} seconds`}
          </p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-cyan-300"
              style={{ width: `${(1 - left / AUTO_ADVANCE_MS) * 100}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="text-xs text-slate-500 underline underline-offset-4 hover:text-slate-300"
          >
            {paused ? "Resume auto-advance" : "Stay on this level"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onReplay}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white active:scale-95"
            >
              Replay
            </button>
            <button
              type="button"
              onClick={onMenu}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white active:scale-95"
            >
              Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
