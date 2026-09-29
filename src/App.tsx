import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Board } from "./components/Board";
import { HomeScreen, HowTo, Hud, LevelSelect } from "./components/Panels";
import {
  IosInstallHint,
  InstallButton,
  PlayStoreModal,
  useInstallPrompt,
} from "./components/Install";
import { WinOverlay } from "./components/WinOverlay";
import {
  TOTAL_LEVELS,
  computeFlow,
  generateLevel,
  levelLabel,
  loadProgress,
  rotateN,
  saveProgress,
  starsFor,
  stepsTo,
  type Level,
  type Progress,
} from "./lib/puzzle";
import { setMuted, sfx } from "./lib/sound";

type Screen = "home" | "levels" | "howto" | "game";
type Mode = "campaign" | "endless";

/* --------------------------------------------------------------- backdrop */

function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#05070d]" />
      <div
        className="flux-float absolute -left-[15%] top-[-10%] h-[55vh] w-[55vh] rounded-full opacity-60 blur-[90px]"
        style={{ background: "radial-gradient(circle,#0e7490 0%,transparent 65%)" }}
      />
      <div
        className="flux-float absolute -right-[10%] top-[25%] h-[50vh] w-[50vh] rounded-full opacity-50 blur-[100px]"
        style={{
          background: "radial-gradient(circle,#5b21b6 0%,transparent 65%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="flux-float absolute bottom-[-15%] left-[25%] h-[45vh] w-[45vh] rounded-full opacity-40 blur-[100px]"
        style={{
          background: "radial-gradient(circle,#155e75 0%,transparent 65%)",
          animationDelay: "-11s",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.35) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.35) 1px,transparent 1px)",
          backgroundSize: "58px 58px",
          maskImage: "radial-gradient(circle at 50% 40%,#000 20%,transparent 78%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 40%,#000 20%,transparent 78%)",
        }}
      />
      <div
        className="flux-scan absolute inset-x-0 top-0 h-[8vh] opacity-40"
        style={{
          background:
            "linear-gradient(180deg,transparent,rgba(34,211,238,0.10),transparent)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------- game */

function Game({
  level,
  mode,
  muted,
  onToggleMute,
  onMenu,
  onNext,
  onReplay,
  onSolved,
}: {
  level: Level;
  mode: Mode;
  muted: boolean;
  onToggleMute: () => void;
  onMenu: () => void;
  onNext: () => void;
  onReplay: () => void;
  onSolved: (levelId: number, mode: Mode, stars: number, moves: number) => void;
}) {
  const [rotations, setRotations] = useState<number[]>(() => level.base.map(() => 0));
  const [moves, setMoves] = useState(0);
  const [hints, setHints] = useState(3);
  const [selected, setSelected] = useState(level.source);
  const [hintIndex, setHintIndex] = useState(-1);
  const [time, setTime] = useState(0);
  const [won, setWon] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [stars, setStars] = useState(3);
  const [intro, setIntro] = useState(true);
  const hintTimer = useRef<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 1700);
    return () => window.clearTimeout(t);
  }, []);

  const masks = useMemo(
    () => rotations.map((r, i) => rotateN(level.base[i], r)),
    [rotations, level],
  );
  const lit = useMemo(
    () => computeFlow(masks, level.width, level.height, level.source),
    [masks, level],
  );
  const litCount = useMemo(() => lit.reduce((n, b) => n + (b ? 1 : 0), 0), [lit]);
  const coresLit = useMemo(
    () => level.sinks.filter((s) => lit[s]).length,
    [lit, level.sinks],
  );
  const total = level.width * level.height;
  const solved = coresLit === level.sinks.length;
  const flawless = litCount === total;

  /* timer */
  useEffect(() => {
    if (won) return;
    const t = window.setInterval(() => setTime((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [won]);

  /* audio: rising chime as the network grows */
  const prevLit = useRef(litCount);
  useEffect(() => {
    if (prevLit.current < litCount) sfx.connect(litCount);
    prevLit.current = litCount;
  }, [litCount]);

  /* win detection */
  useEffect(() => {
    if (!solved || won) return;
    setWon(true);
    const earned = Math.max(1, Math.min(3, starsFor(moves, level.par) - (hints > 0 ? 1 : 0)));
    setStars(earned);
    sfx.win();
    const t = window.setTimeout(() => setShowWin(true), 600);
    onSolved(level.id, mode, earned, moves);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, won]);

  useEffect(() => () => {
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
  }, []);

  const rotate = useCallback(
    (i: number) => {
      if (won) return;
      setRotations((rs) => rs.map((r, idx) => (idx === i ? r + 1 : r)));
      setMoves((m) => m + 1);
      setSelected(i);
      setHintIndex((h) => (h === i ? h : -1));
      sfx.rotate();
    },
    [won],
  );

  const select = useCallback((i: number) => setSelected(i), []);

  const restart = useCallback(() => {
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    setRotations(level.base.map(() => 0));
    setMoves(0);
    setHints(3);
    setTime(0);
    setSelected(level.source);
    setHintIndex(-1);
    setWon(false);
    setShowWin(false);
    // suppress the "growing network" chime for the freshly reset board
    prevLit.current = Number.MAX_SAFE_INTEGER;
    sfx.start();
  }, [level]);

  const takeHint = useCallback(() => {
    if (won) return;
    if (hints <= 0) {
      sfx.bad();
      return;
    }
    // pick the misaligned tile that best extends the already-powered region
    let target = -1;
    let fallback = -1;
    for (let i = 0; i < masks.length; i++) {
      if (masks[i] === level.solution[i]) continue;
      if (fallback < 0) fallback = i;
      const x = i % level.width;
      const y = (i / level.width) | 0;
      const touching =
        i === level.source ||
        [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ].some(([nx, ny]) => {
          if (nx < 0 || ny < 0 || nx >= level.width || ny >= level.height) return false;
          return lit[ny * level.width + nx];
        });
      if (touching) {
        target = i;
        break;
      }
    }
    if (target < 0) target = fallback;
    if (target < 0) return;
    const k = stepsTo(level.solution[target], masks[target]);
    setRotations((rs) => rs.map((r, idx) => (idx === target ? r + k : r)));
    setMoves((m) => m + k);
    setHints((h) => h - 1);
    setSelected(target);
    setHintIndex(target);
    sfx.hint();
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(
      () => setHintIndex((h) => (h === target ? -1 : h)),
      2600,
    );
  }, [hints, masks, level, won, lit]);

  return (
    <div className="relative w-full">
      <div className="mb-4 w-full">
        <Hud
          levelId={level.id}
          mode={mode}
          moves={moves}
          par={level.par}
          time={time}
          litCount={litCount}
          total={total}
          coresLit={coresLit}
          coresTotal={level.sinks.length}
          hints={hints}
          muted={muted}
          onHint={takeHint}
          onRestart={restart}
          onMenu={onMenu}
          onToggleMute={onToggleMute}
        />
      </div>

      <Board
        level={level}
        rotations={rotations}
        masks={masks}
        lit={lit}
        selected={selected}
        hintIndex={hintIndex}
        solved={won}
        onRotate={rotate}
        onSelect={select}
      />

      {intro && !won && (
        <div className="pointer-events-none absolute inset-x-0 top-[26%] z-20 flex justify-center">
          <div className="flux-rise rounded-2xl border border-cyan-300/25 bg-slate-950/80 px-6 py-3 text-center backdrop-blur-sm">
            <div className="text-lg font-black tracking-[0.18em] text-cyan-200">
              {mode === "endless"
                ? `ROUND ${level.id - TOTAL_LEVELS}`
                : `LEVEL ${String(level.id).padStart(2, "0")}`}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.3em] text-slate-500">
              {levelLabel(level.id)} · target {level.par} turns
            </div>
          </div>
        </div>
      )}

      <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
        Tap a tile to rotate it clockwise ·{" "}
        <span className="text-cyan-400/80">reactor</span> powers the grid · wake every{" "}
        <span className="text-amber-400/80">core</span>
        <span className="hidden sm:inline"> · arrow keys + space also work</span>
      </p>

      {showWin && (
        <WinOverlay
          level={level}
          moves={moves}
          time={time}
          stars={stars}
          flawless={flawless}
          endlessRound={mode === "endless" ? level.id - TOTAL_LEVELS : null}
          isLast={mode === "campaign" && level.id >= TOTAL_LEVELS}
          onNext={onNext}
          onReplay={onReplay}
          onMenu={onMenu}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- app */

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  // app-shortcut deep links: ./?screen=game · ./?mode=endless · ./?level=7
  const [params] = useState(
    () => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search),
  );
  const [screen, setScreen] = useState<Screen>(() =>
    params.get("screen") === "game" ? "game" : "home",
  );
  const [mode, setMode] = useState<Mode>(() =>
    params.get("mode") === "endless" ? "endless" : "campaign",
  );
  const [levelId, setLevelId] = useState(() => {
    const requested = Number(params.get("level"));
    if (Number.isFinite(requested) && requested >= 1 && requested <= TOTAL_LEVELS) {
      return Math.floor(requested);
    }
    return params.get("mode") === "endless" ? TOTAL_LEVELS + 1 : 1;
  });
  const [replayNonce, setReplayNonce] = useState(0);
  const [showPublish, setShowPublish] = useState(false);
  const install = useInstallPrompt();

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => setMuted(progress.muted), [progress.muted]);

  const level = useMemo(() => generateLevel(levelId), [levelId]);

  const totalStars = useMemo(
    () => Object.values(progress.stars).reduce((a, b) => a + b, 0),
    [progress.stars],
  );

  const handleSolved = useCallback(
    (id: number, m: Mode, stars: number, moves: number) => {
      setProgress((p) => {
        if (m === "endless") {
          const round = Math.max(1, id - TOTAL_LEVELS);
          return { ...p, endlessBest: Math.max(p.endlessBest, round) };
        }
        const prevStars = p.stars[id] ?? 0;
        const prevBest = p.best[id];
        return {
          ...p,
          unlocked: Math.min(Math.max(p.unlocked, id + 1), TOTAL_LEVELS),
          stars: { ...p.stars, [id]: Math.max(prevStars, stars) },
          best: {
            ...p.best,
            [id]: prevBest === undefined ? moves : Math.min(prevBest, moves),
          },
        };
      });
    },
    [],
  );

  const startCampaign = useCallback((id: number) => {
    setMode("campaign");
    setLevelId(id);
    setScreen("game");
    sfx.start();
  }, []);

  const startEndless = useCallback(() => {
    setMode("endless");
    setLevelId((id) => (id > TOTAL_LEVELS ? id : TOTAL_LEVELS + 1));
    setScreen("game");
    sfx.start();
  }, []);

  const goNext = useCallback(() => {
    if (mode === "endless") {
      setLevelId((id) => id + 1);
    } else if (levelId < TOTAL_LEVELS) {
      setLevelId((id) => id + 1);
    } else {
      setMode("endless");
      setLevelId(TOTAL_LEVELS + 1);
    }
    setScreen("game");
  }, [mode, levelId]);

  const replay = useCallback(() => {
    setReplayNonce((n) => n + 1);
  }, []);

  return (
    <div className="relative min-h-screen w-full text-slate-200">
      <Backdrop />

      <main className="flux-shell relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-4 py-6 sm:px-6">
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          {screen === "home" && (
            <HomeScreen
              unlocked={progress.unlocked}
              endlessBest={progress.endlessBest}
              totalStars={totalStars}
              onContinue={() => startCampaign(Math.min(progress.unlocked, TOTAL_LEVELS))}
              onLevels={() => setScreen("levels")}
              onEndless={startEndless}
              onHowTo={() => setScreen("howto")}
              onPublish={() => setShowPublish(true)}
              installSlot={
                <>
                  {install.canInstall && <InstallButton onInstall={() => void install.install()} />}
                  {!install.canInstall && !install.installed && install.isIOS && <IosInstallHint />}
                </>
              }
            />
          )}

          {screen === "levels" && (
            <LevelSelect
              unlocked={progress.unlocked}
              stars={progress.stars}
              onPick={startCampaign}
              onBack={() => setScreen("home")}
              onEndless={startEndless}
            />
          )}

          {screen === "howto" && <HowTo onClose={() => setScreen("home")} />}

          {screen === "game" && (
            <Game
              key={`${mode}-${levelId}-${replayNonce}`}
              level={level}
              mode={mode}
              muted={progress.muted}
              onToggleMute={() =>
                setProgress((p) => ({ ...p, muted: !p.muted }))
              }
              onMenu={() => setScreen("home")}
              onNext={goNext}
              onReplay={replay}
              onSolved={handleSolved}
            />
          )}
        </div>

        {showPublish && <PlayStoreModal onClose={() => setShowPublish(false)} />}

        <footer className="mt-8 w-full pb-2 text-center text-[10px] uppercase tracking-[0.28em] text-slate-600">
          flux · a circuit-rotation puzzle
          {install.installed && (
            <span className="ml-2 text-emerald-500/80">· installed</span>
          )}
        </footer>
      </main>
    </div>
  );
}
