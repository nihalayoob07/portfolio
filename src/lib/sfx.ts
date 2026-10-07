"use client";

// Sound effects, synthesised with Web Audio so there are no files to load.
// Browsers only allow sound after a click, tap or key press, so the first one anywhere on the
// page unlocks it; until then the state is "locked". Muting applies to every effect.

type State = "locked" | "on" | "muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let muted = false;
// When a gesture last woke audio up, so the same tap on the sound button doesn't also mute it.
let unlockedAt = -1e9;
const listeners = new Set<() => void>();

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    ctx.onstatechange = emit;
  }
  return ctx;
}

function emit() {
  listeners.forEach((f) => f());
}

const live = () => !muted && ctx?.state === "running";

// Plays now if audio is running; a click that is itself unlocking audio waits for the resume.
function play(fn: () => void) {
  if (muted) return;
  const c = audio();
  if (c.state === "running") fn();
  else void c.resume().then(() => c.state === "running" && fn());
}

if (typeof window !== "undefined") {
  const unlock = () => {
    if (ctx?.state !== "running") unlockedAt = performance.now();
    void audio().resume();
  };
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
}

export const sound = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  state(): State {
    return muted ? "muted" : ctx?.state === "running" ? "on" : "locked";
  },
  // Called from a click, so it can also unlock.
  toggle() {
    if (performance.now() - unlockedAt < 1000) muted = false;
    else muted = !muted;
    void audio().resume();
    emit();
  },
};

// One alarm-clock beep: a square wave, softened, with a fast attack and release.
function beep(t: number) {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = "square";
  o.frequency.value = 1318;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3800;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.07, t + 0.005);
  g.gain.setValueAtTime(0.07, t + 0.075);
  g.gain.linearRampToValueAtTime(0, t + 0.085);
  o.connect(lp).connect(g).connect(master!);
  o.start(t);
  o.stop(t + 0.1);
}

let alarmTimer = 0;
// Four quick beeps every second while the alarm rings.
export function alarm(on: boolean) {
  window.clearInterval(alarmTimer);
  alarmTimer = 0;
  if (!on) return;
  const ring = () => {
    if (!live()) return;
    const t = ctx!.currentTime + 0.02;
    for (let i = 0; i < 4; i++) beep(t + i * 0.13);
  };
  ring();
  alarmTimer = window.setInterval(ring, 1000);
}

// A short filtered noise burst plus a falling "thock" for the switch body.
function tick(t: number, freq: number, level: number, length: number) {
  const c = ctx!;
  const src = c.createBufferSource();
  src.buffer = noise;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq * (0.9 + Math.random() * 0.2);
  bp.Q.value = 2.2;
  const g = c.createGain();
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + length);
  src.connect(bp).connect(g).connect(master!);
  src.start(t);
  src.stop(t + length + 0.01);

  const body = c.createOscillator();
  body.frequency.setValueAtTime(240 + Math.random() * 40, t);
  body.frequency.exponentialRampToValueAtTime(90, t + 0.04);
  const bg = c.createGain();
  bg.gain.setValueAtTime(level * 0.5, t);
  bg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  body.connect(bg).connect(master!);
  body.start(t);
  body.stop(t + 0.06);
}

// A mechanical key: the press, then a lighter click as it springs back.
export function keyClick() {
  play(() => {
    const t = ctx!.currentTime + 0.005;
    tick(t, 3400, 0.6, 0.02);
    tick(t + 0.085, 4300, 0.25, 0.012);
  });
}
