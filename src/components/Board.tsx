import { useEffect } from "react";
import type { Level } from "../lib/puzzle";
import { Tile } from "./Tile";

type Props = {
  level: Level;
  rotations: number[];
  masks: number[];
  lit: boolean[];
  selected: number;
  hintIndex: number;
  solved: boolean;
  onRotate: (index: number) => void;
  onSelect: (index: number) => void;
};

export function Board({
  level,
  rotations,
  masks,
  lit,
  selected,
  hintIndex,
  solved,
  onRotate,
  onSelect,
}: Props) {
  const { width, height, sinks, source } = level;
  const sinkSet = new Set(sinks);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      const x = selected % width;
      const y = (selected / width) | 0;
      if (e.key === " " || e.key === "Enter") {
        onRotate(selected);
        return;
      }
      let nx = x;
      let ny = y;
      if (e.key === "ArrowUp") ny = Math.max(0, y - 1);
      if (e.key === "ArrowDown") ny = Math.min(height - 1, y + 1);
      if (e.key === "ArrowLeft") nx = Math.max(0, x - 1);
      if (e.key === "ArrowRight") nx = Math.min(width - 1, x + 1);
      onSelect(ny * width + nx);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, width, height, onRotate, onSelect]);

  return (
    <div
      className="relative mx-auto w-full"
      style={{
        maxWidth: `min(100%, calc(${(width / height).toFixed(4)} * 62vh), 600px)`,
      }}
    >
      <div
        className="pointer-events-none absolute -inset-6 rounded-[36px] opacity-70 blur-2xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(34,211,238,0.16), transparent 70%)",
        }}
      />
      {solved && (
        <div className="pointer-events-none absolute -inset-3 z-20 rounded-[34px] border-2 border-cyan-300/50 flux-ring" />
      )}
      <div
        className="relative grid"
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
          gap: "clamp(3px, 0.8vw, 6px)",
        }}
      >
        {masks.map((_, i) => {
          const kind = i === source ? "source" : sinkSet.has(i) ? "sink" : "plain";
          return (
            <div key={i} className="aspect-square">
              <Tile
                base={level.base[i]}
                rotation={rotations[i]}
                lit={lit[i]}
                kind={kind}
                sinkLit={lit[i]}
                selected={selected === i}
                hint={hintIndex === i}
                locked={solved}
                onRotate={() => onRotate(i)}
                onSelect={() => onSelect(i)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
