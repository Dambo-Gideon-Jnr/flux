import { memo } from "react";
import { pipePaths } from "../lib/puzzle";

export type TileKind = "plain" | "source" | "sink";

type Props = {
  base: number;
  rotation: number;
  lit: boolean;
  kind: TileKind;
  sinkLit: boolean;
  selected: boolean;
  hint: boolean;
  locked: boolean;
  onRotate: () => void;
  onSelect: () => void;
};

function TileInner({
  base,
  rotation,
  lit,
  kind,
  sinkLit,
  selected,
  hint,
  locked,
  onRotate,
  onSelect,
}: Props) {
  const paths = pipePaths(base);
  const stroke = lit ? "#3ee9ff" : "#414f6b";
  const casing = lit ? "#0d4b5c" : "#161d2e";

  return (
    <button
      type="button"
      aria-label={`Pipe tile, ${paths.length} connector${paths.length === 1 ? "" : "s"}`}
      onClick={() => {
        onSelect();
        if (!locked) onRotate();
      }}
      className={[
        "group relative block h-full w-full select-none rounded-[18%] outline-none",
        "transition-[background-color,box-shadow,transform] duration-200",
        "focus-visible:ring-2 focus-visible:ring-cyan-300/70",
        locked ? "cursor-default" : "cursor-pointer active:scale-[0.93]",
      ].join(" ")}
      style={{
        backgroundColor: selected ? "rgba(34,211,238,0.10)" : "rgba(148,163,184,0.045)",
        boxShadow: selected
          ? "inset 0 0 0 1.5px rgba(34,211,238,0.55), 0 0 22px -6px rgba(34,211,238,0.6)"
          : "inset 0 0 0 1px rgba(148,163,184,0.09)",
      }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <g
          style={{
            transform: `rotate(${rotation * 90}deg)`,
            transformBox: "view-box",
            transformOrigin: "50% 50%",
            transition: "transform 300ms cubic-bezier(.32,1.5,.55,1)",
          }}
        >
          {paths.map((d, i) => (
            <path
              key={`c${i}`}
              d={d}
              fill="none"
              stroke={casing}
              strokeWidth={27}
              strokeLinecap="round"
            />
          ))}
          {paths.map((d, i) => (
            <path
              key={`p${i}`}
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth={12}
              strokeLinecap="round"
              style={{
                transition: "stroke 260ms ease",
                filter: lit
                  ? "drop-shadow(0 0 5px rgba(34,211,238,0.85))"
                  : "none",
              }}
            />
          ))}
          {lit &&
            paths.map((d, i) => (
              <path
                key={`f${i}`}
                d={d}
                fill="none"
                stroke="#ffffff"
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray="6 20"
                className="flux-dash"
                opacity={0.9}
              />
            ))}
          {paths.length > 0 && (
            <circle
              cx={50}
              cy={50}
              r={7}
              fill={lit ? "#c9f8ff" : "#5a6b8c"}
              style={{
                transition: "fill 260ms ease",
                filter: lit ? "drop-shadow(0 0 6px rgba(34,211,238,0.9))" : "none",
              }}
            />
          )}
        </g>

        {/* non-rotating markers */}
        {kind === "source" && (
          <g className="flux-pulse">
            <circle cx={50} cy={50} r={17} fill="#0b1220" opacity={0.85} />
            <circle
              cx={50}
              cy={50}
              r={11}
              fill="url(#srcGrad)"
              style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.95))" }}
            />
            <circle cx={50} cy={50} r={19} fill="none" stroke="#22d3ee" strokeWidth={2} opacity={0.5} />
          </g>
        )}

        {kind === "sink" && (
          <g>
            <rect
              x={33}
              y={33}
              width={34}
              height={34}
              rx={7}
              fill={sinkLit ? "#fde68a" : "#111a2c"}
              stroke={sinkLit ? "#fbbf24" : "#5b6b8c"}
              strokeWidth={3}
              style={{
                transition: "fill 260ms ease, stroke 260ms ease",
                filter: sinkLit
                  ? "drop-shadow(0 0 10px rgba(251,191,36,0.95))"
                  : "none",
              }}
            />
            {sinkLit ? (
              <path
                d="M42 50.5 L47.5 56 L59 44"
                fill="none"
                stroke="#3b2a06"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <circle cx={50} cy={50} r={5} fill="#5b6b8c" />
            )}
          </g>
        )}

        {kind === "source" && (
          <defs>
            <radialGradient id="srcGrad">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#0891b2" />
            </radialGradient>
          </defs>
        )}
      </svg>

      {hint && (
        <span className="pointer-events-none absolute inset-0 rounded-[18%] ring-2 ring-amber-300/90 flux-hint" />
      )}
    </button>
  );
}

export const Tile = memo(TileInner);
