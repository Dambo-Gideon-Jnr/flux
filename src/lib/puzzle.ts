/**
 * FLUX — puzzle engine
 *
 * A level is a grid of pipe tiles. Every tile has a set of connectors
 * (a 4-bit mask: N=1, E=2, S=4, W=8). Rotating a tile cycles the mask.
 * Energy flows out of the SOURCE tile, travels through tiles that are
 * mutually connected, and must reach every SINK tile.
 *
 * Levels are built from a random spanning tree of the grid, so a
 * solution always exists (and it is reached by aligning every tile).
 */

export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export const ALL_BITS = [N, E, S, W];

const DIRS = [
  { bit: N, dx: 0, dy: -1, opp: S },
  { bit: E, dx: 1, dy: 0, opp: W },
  { bit: S, dx: 0, dy: 1, opp: N },
  { bit: W, dx: -1, dy: 0, opp: E },
];

export const TOTAL_LEVELS = 50;

/* ------------------------------------------------------------------ rng */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(...nums: number[]) {
  let h = 2166136261;
  for (const n of nums) {
    h ^= n | 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* --------------------------------------------------------------- helpers */

export function rotateCW(mask: number): number {
  return ((mask << 1) | (mask >>> 3)) & 15;
}

export function rotateN(mask: number, times: number): number {
  let m = mask;
  for (let i = 0; i < ((times % 4) + 4) % 4; i++) m = rotateCW(m);
  return m;
}

export function popcount(mask: number): number {
  return ALL_BITS.reduce((n, b) => n + (mask & b ? 1 : 0), 0);
}

export function stepsTo(target: number, current: number): number {
  let m = current;
  for (let k = 0; k < 4; k++) {
    if (m === target) return k;
    m = rotateCW(m);
  }
  return 0;
}

/* ----------------------------------------------------------------- types */

export type Level = {
  id: number;
  width: number;
  height: number;
  source: number;
  sinks: number[];
  base: number[]; // scrambled connector masks
  solution: number[]; // solved connector masks
  par: number; // optimal number of quarter-turns
};

export type Progress = {
  unlocked: number;
  stars: Record<number, number>;
  best: Record<number, number>; // fewest moves per level
  endlessBest: number;
  muted: boolean;
};

/* ------------------------------------------------------------ difficulty */

type Preset = { w: number; h: number; sinks: number; label: string };

const PRESETS: Preset[] = [
  { w: 3, h: 3, sinks: 1, label: "Warm-up" },
  { w: 3, h: 4, sinks: 1, label: "Warm-up" },
  { w: 4, h: 4, sinks: 2, label: "Novice" },
  { w: 4, h: 5, sinks: 2, label: "Novice" },
  { w: 5, h: 5, sinks: 2, label: "Apprentice" },
  { w: 5, h: 6, sinks: 3, label: "Apprentice" },
  { w: 6, h: 6, sinks: 3, label: "Adept" },
  { w: 6, h: 7, sinks: 3, label: "Adept" },
  { w: 7, h: 7, sinks: 4, label: "Expert" },
  { w: 7, h: 8, sinks: 4, label: "Master" },
];

export function presetIndexFor(id: number, seed?: number): number {
  if (id > TOTAL_LEVELS) {
    const endlessSeed = seed === undefined ? id * 104729 : hash(seed, id);
    return 5 + (hash(endlessSeed) % 5);
  }
  return Math.min(Math.floor(((id - 1) * PRESETS.length) / TOTAL_LEVELS), PRESETS.length - 1);
}

export function levelLabel(id: number): string {
  return PRESETS[presetIndexFor(id)].label;
}

function presetFor(id: number, seed?: number): Preset {
  return PRESETS[presetIndexFor(id, seed)];
}

/* ----------------------------------------------------------- generation */

function buildTree(w: number, h: number, rng: () => number): number[] {
  const size = w * h;
  const masks = new Array<number>(size).fill(0);
  const visited = new Array<boolean>(size).fill(false);
  const root = Math.floor(rng() * size);
  visited[root] = true;
  type Edge = { from: number; to: number; bit: number; opp: number };
  const frontier: Edge[] = [];

  const pushEdges = (idx: number) => {
    const x = idx % w;
    const y = (idx / w) | 0;
    for (const d of DIRS) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (visited[ni]) continue;
      frontier.push({ from: idx, to: ni, bit: d.bit, opp: d.opp });
    }
  };

  pushEdges(root);

  while (frontier.length) {
    const i = Math.floor(rng() * frontier.length);
    const edge = frontier.splice(i, 1)[0];
    if (visited[edge.to]) continue;
    visited[edge.to] = true;
    masks[edge.from] |= edge.bit;
    masks[edge.to] |= edge.opp;
    pushEdges(edge.to);
  }
  return masks;
}

function bfsDist(masks: number[], w: number, h: number, from: number) {
  const size = w * h;
  const dist = new Array<number>(size).fill(-1);
  dist[from] = 0;
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    const x = cur % w;
    const y = (cur / w) | 0;
    for (const d of DIRS) {
      if (!(masks[cur] & d.bit)) continue;
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (dist[ni] !== -1) continue;
      if (!(masks[ni] & d.opp)) continue;
      dist[ni] = dist[cur] + 1;
      queue.push(ni);
    }
  }
  return dist;
}

export function generateLevel(id: number, seed?: number): Level {
  const preset = presetFor(id, seed);
  const { w, h } = preset;
  const size = w * h;
  const rng = mulberry32(
    seed === undefined ? hash(0x9e3779b9, id * 7919, id) : hash(seed, id),
  );
  const solution = buildTree(w, h, rng);

  // leaves = dead ends, the nicest places for a source / a sink
  const leaves: number[] = [];
  for (let i = 0; i < size; i++) if (popcount(solution[i]) === 1) leaves.push(i);
  if (leaves.length < 2) {
    for (let i = 0; i < size; i++) if (popcount(solution[i]) <= 2) leaves.push(i);
  }

  const source = leaves[Math.floor(rng() * leaves.length)];
  const dist = bfsDist(solution, w, h, source);

  const candidates = leaves
    .filter((i) => i !== source && dist[i] > 0)
    .sort((a, b) => dist[b] - dist[a]);

  const sinks: number[] = [];
  const wanted = Math.min(preset.sinks, Math.max(1, candidates.length));
  for (const c of candidates) {
    if (sinks.length >= wanted) break;
    if (sinks.includes(c)) continue;
    // keep sinks spread out from one another
    const cx = c % w;
    const cy = (c / w) | 0;
    const tooClose = sinks.some((s) => {
      const sx = s % w;
      const sy = (s / w) | 0;
      return Math.abs(sx - cx) + Math.abs(sy - cy) < 2;
    });
    if (tooClose && candidates.length > wanted) continue;
    sinks.push(c);
  }
  if (!sinks.length) sinks.push(candidates[0] ?? (source + 1) % size);

  // ---- scramble ------------------------------------------------------
  let base: number[] = [];
  let par = 0;
  const minWrong = Math.max(3, Math.floor(size * 0.45));
  for (let attempt = 0; attempt < 60; attempt++) {
    const candidate = solution.map((m) => {
      let r = Math.floor(rng() * 4);
      if (rng() < 0.5) r = 1 + Math.floor(rng() * 3); // bias away from solved
      return rotateN(m, r);
    });
    let wrong = 0;
    let steps = 0;
    for (let i = 0; i < size; i++) {
      const k = stepsTo(solution[i], candidate[i]);
      steps += k;
      if (k > 0) wrong++;
    }
    const lit = computeFlow(candidate, w, h, source);
    const solvedNow = sinks.every((s) => lit[s]);
    if (!solvedNow && wrong >= minWrong && steps >= size * 0.5) {
      base = candidate;
      par = steps;
      break;
    }
  }
  if (!base.length) {
    base = solution.map((m, i) => (i % 5 === 0 ? m : rotateN(m, 1 + (i % 3))));
    par = 0;
    for (let i = 0; i < size; i++) par += stepsTo(solution[i], base[i]);
  }

  return { id, width: w, height: h, source, sinks, base, solution, par };
}

/* ----------------------------------------------------------------- flow */

export function computeFlow(
  masks: number[],
  w: number,
  h: number,
  source: number,
): boolean[] {
  const size = w * h;
  const lit = new Array<boolean>(size).fill(false);
  if (source < 0 || source >= size) return lit;
  lit[source] = true;
  const stack = [source];
  while (stack.length) {
    const cur = stack.pop() as number;
    const x = cur % w;
    const y = (cur / w) | 0;
    for (const d of DIRS) {
      if (!(masks[cur] & d.bit)) continue;
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (lit[ni] || !(masks[ni] & d.opp)) continue;
      lit[ni] = true;
      stack.push(ni);
    }
  }
  return lit;
}

/* ---------------------------------------------------------- pipe shapes */

const MID: Record<number, [number, number]> = {
  [N]: [50, 0],
  [E]: [100, 50],
  [S]: [50, 100],
  [W]: [0, 50],
};

/** SVG path data (viewBox 0 0 100 100) describing a tile's pipes. */
export function pipePaths(mask: number): string[] {
  const bits = ALL_BITS.filter((b) => mask & b);
  if (bits.length === 0) return [];
  if (bits.length === 2) {
    const a = bits[0];
    const b = bits[1];
    const combo = a | b;
    if (
      combo === (N | E) ||
      combo === (E | S) ||
      combo === (S | W) ||
      combo === (W | N)
    ) {
      const p = MID[a];
      const q = MID[b];
      return [`M ${p[0]} ${p[1]} A 50 50 0 0 0 ${q[0]} ${q[1]}`];
    }
  }
  return bits.map((b) => `M 50 50 L ${MID[b][0]} ${MID[b][1]}`);
}

/* -------------------------------------------------------------- progress */

const KEY = "flux.save.v1";

export const emptyProgress: Progress = {
  unlocked: 1,
  stars: {},
  best: {},
  endlessBest: 0,
  muted: false,
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...emptyProgress };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      unlocked: Math.max(1, parsed.unlocked ?? 1),
      stars: parsed.stars ?? {},
      best: parsed.best ?? {},
      endlessBest: parsed.endlessBest ?? 0,
      muted: parsed.muted ?? false,
    };
  } catch {
    return { ...emptyProgress };
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function starsFor(moves: number, par: number): number {
  if (moves <= Math.ceil(par * 1.15)) return 3;
  if (moves <= Math.ceil(par * 1.7)) return 2;
  return 1;
}
