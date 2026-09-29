/** Tiny procedural sound engine (no assets, pure WebAudio). */

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean) {
  muted = value;
}

function audio(): AudioContext | null {
  if (muted) return null;
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type ToneOptions = {
  freq: number;
  to?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
};

function tone({
  freq,
  to,
  dur = 0.12,
  type = "sine",
  gain = 0.14,
  delay = 0,
}: ToneOptions) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to && to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

export const sfx = {
  rotate() {
    tone({ freq: 320, to: 470, dur: 0.07, type: "triangle", gain: 0.07 });
  },
  connect(count: number) {
    tone({
      freq: 520 + Math.min(count, 10) * 42,
      to: 780 + Math.min(count, 10) * 42,
      dur: 0.14,
      type: "sine",
      gain: 0.09,
    });
  },
  hint() {
    tone({ freq: 880, to: 1320, dur: 0.16, type: "sine", gain: 0.08 });
  },
  bad() {
    tone({ freq: 190, to: 130, dur: 0.16, type: "sawtooth", gain: 0.05 });
  },
  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) =>
      tone({ freq: f, dur: 0.34, type: "sine", gain: 0.11, delay: i * 0.085 }),
    );
  },
  start() {
    tone({ freq: 220, to: 660, dur: 0.3, type: "triangle", gain: 0.08 });
  },
};
