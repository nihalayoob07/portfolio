"use client";

// Sound effects, synthesised with Web Audio so there are no files to load.
// Browsers only allow sound after a click, tap or key press, so the first one anywhere on the
// page unlocks it; until then the state is "locked". Muting applies to every effect and is
// remembered on this device. The effects: Drill's alarm and the cat clicker's switch.

type State = "locked" | "on" | "muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
const MUTE_KEY = "sfx-muted";
let muted = false;
try {
  muted = typeof window !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
} catch {
  /* storage unavailable: start unmuted */
}
// When a gesture last woke audio up, so the same tap on the sound button doesn't also mute it.
let unlockedAt = -1e9;
const listeners = new Set<() => void>();

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 1;
    // A gentle compressor lets the effects be loud without clipping when they stack up.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.002;
    comp.release.value = 0.12;
    const makeup = ctx.createGain();
    makeup.gain.value = 1.35;
    master.connect(comp).connect(makeup).connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
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
  // iOS only lets audio start on a tap's end or a click, not on pointerdown, so listen for all of them.
  for (const type of ["pointerdown", "touchend", "click", "keydown"]) window.addEventListener(type, unlock, { capture: true });
}

export const sound = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  state(): State {
    return muted ? "muted" : ctx?.state === "running" ? "on" : "locked";
  },
  // Both are called from a click, so they can also unlock audio.
  set(on: boolean) {
    muted = !on;
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* not remembered, still applies now */
    }
    void audio().resume();
    emit();
  },
  toggle() {
    sound.set(performance.now() - unlockedAt < 1000 || muted);
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
  g.gain.linearRampToValueAtTime(0.15, t + 0.005);
  g.gain.setValueAtTime(0.15, t + 0.075);
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

// A mechanical key: the press, then a lighter click as it springs back.
// A filtered noise burst: the snap of plastic on plastic.
function snap(t: number, type: BiquadFilterType, freq: number, q: number, level: number, length: number) {
  const c = ctx!;
  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + 0.0008);
  g.gain.exponentialRampToValueAtTime(0.0008, t + length);
  src.connect(f).connect(g).connect(master!);
  src.start(t, Math.random() * 0.8); // a different stretch of noise each time
  src.stop(t + length + 0.01);
}

// A short tone that drops in pitch: the ping of the click jacket, or the keycap's body.
function tone(t: number, type: OscillatorType, from: number, to: number, level: number, length: number) {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + length);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0008, t + length);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + length + 0.01);
}

// A clicky mechanical switch: the click jacket snaps (bright crack plus a metallic ping), the
// keycap bottoms out a few milliseconds later (a deep plastic thock), and on the way back up a
// lighter click. Each press varies a little, so spamming it doesn't sound like a loop.
export function keyClick() {
  play(() => {
    const t = ctx!.currentTime + 0.004;
    const v = () => 0.92 + Math.random() * 0.16;
    // Press: the click.
    snap(t, "highpass", 3800 * v(), 0.7, 0.95 * v(), 0.012);
    snap(t, "bandpass", 5200 * v(), 1.6, 0.6, 0.008);
    tone(t, "triangle", 3600 * v(), 2900, 0.22, 0.03);
    // Bottom-out: the thock.
    const b = t + 0.009;
    tone(b, "sine", 210 * v(), 95, 0.75, 0.07);
    snap(b, "lowpass", 900 * v(), 0.8, 0.5, 0.035);
    snap(b, "bandpass", 1600 * v(), 1.2, 0.25, 0.02);
    // Release: the lighter click back up.
    const r = t + 0.075 + Math.random() * 0.02;
    snap(r, "highpass", 4500 * v(), 0.7, 0.45, 0.008);
    tone(r, "triangle", 4200 * v(), 3400, 0.1, 0.02);
    tone(r + 0.004, "sine", 300 * v(), 160, 0.22, 0.04);
  });
}
