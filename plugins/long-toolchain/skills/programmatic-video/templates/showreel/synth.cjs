// Procedural soundtrack, sample-locked to the same beat map as the visuals.
const fs = require("fs");
const TL = require("./timeline.js");
const SR = 48000,
  N = SR * TL.DUR;
const dry = [new Float32Array(N), new Float32Array(N)],
  send = [new Float32Array(N), new Float32Array(N)];
let seed = 1;
const noise = () =>
  (seed = (seed * 1664525 + 1013904223) >>> 0) / 2147483648 - 1;
const TAU = Math.PI * 2;

function put(i, l, r, wet = 0) {
  if (i < 0 || i >= N) return;
  dry[0][i] += l;
  dry[1][i] += r;
  if (wet) {
    send[0][i] += l * wet;
    send[1][i] += r * wet;
  }
}
const pan = (v, p) => [
  v * Math.cos(((p + 1) * Math.PI) / 4),
  v * Math.sin(((p + 1) * Math.PI) / 4),
];

function kick(t0, g = 0.9, len = 0.4) {
  let ph = 0;
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < len * SR; i++) {
    const τ = i / SR,
      f = 44 + 120 * Math.exp(-τ * 32);
    ph += (TAU * f) / SR;
    const v =
      Math.sin(ph) * Math.exp(-τ * 7.5) * g +
      (τ < 0.004 ? noise() * 0.5 * g : 0);
    put(s0 + i, v, v);
  }
}
function impact(t0, g = 1) {
  kick(t0, g * 1.1, 0.9);
  let lp = 0;
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < 1.4 * SR; i++) {
    const τ = i / SR;
    lp += (noise() - lp) * 0.08;
    const sub = Math.sin(TAU * 38 * τ) * Math.exp(-τ * 2.4) * 0.55;
    const n = lp * Math.exp(-τ * 5) * 1.6;
    put(s0 + i, (sub + n) * g, (sub + n * 0.9) * g, 0.5);
  }
}
function hat(t0, g = 0.12, p = 0) {
  let prev = 0;
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < 0.06 * SR; i++) {
    const x = noise(),
      hp = x - prev;
    prev = x;
    const [l, r] = pan(hp * Math.exp((-i / SR) * 70) * g, p);
    put(s0 + i, l, r, 0.15);
  }
}
function sweepNoise(t0, t1, f0, f1, g, shape, p0 = -0.6, p1 = 0.6) {
  // state-variable bandpass sweep
  let low = 0,
    band = 0;
  const s0 = Math.round(t0 * SR),
    n = Math.round((t1 - t0) * SR);
  for (let i = 0; i < n; i++) {
    const u = i / n,
      f = f0 * Math.pow(f1 / f0, u),
      F = 2 * Math.sin((Math.PI * Math.min(f, 12000)) / SR);
    const hi = noise() - low - 0.5 * band;
    band += F * hi;
    low += F * band;
    const [l, r] = pan(band * shape(u) * g, lerp(p0, p1, u));
    put(s0 + i, l, r, 0.3);
  }
}
const lerp = (a, b, u) => a + (b - a) * u;
function tone(
  t0,
  len,
  f0,
  f1,
  g,
  wave = "sine",
  p = 0,
  wet = 0.35,
  atk = 0.004,
  dec = 12,
) {
  let ph = 0;
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < len * SR; i++) {
    const τ = i / SR,
      f = f0 * Math.pow(f1 / f0, τ / len);
    ph += f / SR;
    const x = ph % 1;
    const w =
      wave === "sine"
        ? Math.sin(TAU * x)
        : wave === "saw"
          ? 2 * x - 1
          : x < 0.5
            ? 1
            : -1;
    const env = Math.min(1, τ / atk) * Math.exp(-τ * dec);
    const [l, r] = pan(w * env * g, p);
    put(s0 + i, l, r, wet);
  }
}
function zap(t0, g = 0.35) {
  // FM pitch-drop
  let pc = 0,
    pm = 0;
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < 0.22 * SR; i++) {
    const τ = i / SR,
      f = 90 + 900 * Math.exp(-τ * 28);
    pm += (TAU * f * 2.01) / SR;
    pc +=
      (TAU * f) / SR + (Math.sin(pm) * 0.9 * Math.exp(-τ * 10) * TAU * f) / SR;
    const v = Math.sin(pc) * Math.exp(-τ * 14) * g;
    put(s0 + i, v, v * 0.85, 0.4);
  }
}
function drone(t0, t1, g = 0.16) {
  // detuned saws, rising pitch + opening filter
  const s0 = Math.round(t0 * SR),
    n = Math.round((t1 - t0) * SR);
  let lp = [0, 0];
  const ph = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const u = i / n,
      f = 55 * Math.pow(4, u * u);
    let v = 0;
    [1, 1.006, 0.497].forEach((d, k) => {
      ph[k] = (ph[k] + (f * d) / SR) % 1;
      v += 2 * ph[k] - 1;
    });
    const cut = 0.02 + 0.3 * u * u;
    lp[0] += (v - lp[0]) * cut;
    lp[1] += (lp[0] - lp[1]) * cut;
    const env = Math.min(1, u * 6) * g;
    put(s0 + i, lp[1] * env, lp[1] * env * 0.95, 0.2);
  }
}

// ── arrangement ───────────────────────────────────────────────────────────────────
sweepNoise(0.0, 0.5, 250, 9000, 0.5, (u) => Math.pow(u, 2.2)); // riser
tone(0.0, 0.5, 110, 880, 0.12, "saw", 0, 0.2, 0.3, 0); // pitch riser
tone(0.04, 0.3, 1760, 1760, 0.18, "sine", 0, 0.5, 0.002, 18); // the dot appears
for (const b of TL.BIG_HITS) impact(b, b === 3.5 ? 0.85 : 1);
for (let b = 1.0; b <= 4.0; b += 0.5)
  if (!TL.BIG_HITS.includes(b)) kick(b, 0.8);
for (let b = 1.5; b < 4.25; b += 0.25)
  hat(b + 0.125, 0.14, Math.sin(b * 5) * 0.6);
for (let b = 1.5; b < 4.25; b += 0.125) hat(b, 0.05, -Math.sin(b * 7) * 0.6);
// bass: offbeat 8ths, A–A–C–D
const BASS = [55, 55, 65.41, 73.42];
for (let k = 0, b = 1.75; b < 4.25; b += 0.5, k++)
  tone(
    b,
    0.22,
    BASS[k % 4],
    BASS[k % 4] * 0.98,
    0.32,
    "square",
    0,
    0,
    0.003,
    9,
  );
// MOTION letters — ascending pentatonic blips
const PENTA = [659.3, 784, 880, 1046.5, 1174.7, 1318.5];
PENTA.forEach((f, i) =>
  tone(
    TL.MOTION_T0 + i * TL.MOTION_STAGGER + 0.04,
    0.18,
    f,
    f,
    0.16,
    "sine",
    -0.6 + i * 0.24,
    0.5,
    0.002,
    16,
  ),
);
// transitions
sweepNoise(
  1.28,
  1.5,
  400,
  6000,
  0.55,
  (u) => Math.sin(Math.PI * u) ** 2,
  -0.8,
  0.8,
);
sweepNoise(
  2.28,
  2.5,
  5000,
  500,
  0.5,
  (u) => Math.sin(Math.PI * u) ** 2,
  0.8,
  -0.8,
);
for (const [w] of TL.WAVE_WORDS)
  tone(w, 0.12, 2200, 1400, 0.09, "square", 0, 0.3, 0.001, 30);
for (const b of TL.MORPH_BEATS) zap(b - 0.02);
zap(2.5, 0.28);
sweepNoise(3.34, 3.5, 300, 9000, 0.6, (u) => u ** 3); // zoom-through
drone(3.5, 4.25);
for (const [w] of TL.TUNNEL_WORDS)
  tone(w, 0.3, 220, 218, 0.12, "saw", 0, 0.4, 0.002, 8);
sweepNoise(3.9, 4.25, 800, 12000, 0.5, (u) => u ** 2.5); // whiteout
// lockup pad chord (Amaj9) + typewriter
[220, 277.2, 329.6, 415.3, 493.9].forEach((f, i) => {
  tone(4.25, 0.75, f, f, 0.07, "sine", -0.5 + i * 0.25, 0.7, 0.01, 2.2);
  tone(
    4.25,
    0.75,
    f * 1.004,
    f * 1.004,
    0.05,
    "saw",
    0.5 - i * 0.25,
    0.6,
    0.02,
    3.5,
  );
});
[...TL.SUBTITLE].forEach((ch, k) => {
  if (ch !== " ")
    sweepNoise(
      TL.SUB_T0 + (k / TL.SUBTITLE.length) * (TL.SUB_T1 - TL.SUB_T0),
      TL.SUB_T0 + (k / TL.SUBTITLE.length) * (TL.SUB_T1 - TL.SUB_T0) + 0.012,
      3500,
      3000,
      0.9,
      (u) => 1 - u,
      0.3,
      0.3,
    );
});
tone(4.46, 0.3, 1318.5, 1318.5, 0.12, "sine", 0.4, 0.6, 0.002, 10); // accent dot pop
sweepNoise(4.72, 4.95, 9000, 300, 0.4, (u) => u ** 2 * (1 - u) * 4, 0.7, -0.7); // iris close suck
tone(4.93, 0.07, 1760, 1760, 0.14, "sine", 0, 0.3, 0.002, 30); // back to the dot

// ── reverb send (Schroeder: 4 combs + 2 allpass per side) ─────────────────────────
function reverb(x, offs) {
  const y = new Float32Array(N);
  for (const [d0, fb] of [
    [1557, 0.8],
    [1617, 0.79],
    [1491, 0.81],
    [1422, 0.8],
  ]) {
    const d = d0 + offs,
      buf = new Float32Array(d);
    let p = 0,
      lp = 0;
    for (let i = 0; i < N; i++) {
      const o = buf[p];
      lp = o * 0.7 + lp * 0.3;
      buf[p] = x[i] + lp * fb;
      p = (p + 1) % d;
      y[i] += o * 0.25;
    }
  }
  for (const d of [225 + offs, 556 + offs]) {
    const buf = new Float32Array(d);
    let p = 0;
    for (let i = 0; i < N; i++) {
      const b = buf[p],
        v = y[i] + b * 0.5;
      buf[p] = v;
      y[i] = b - v * 0.5;
      p = (p + 1) % d;
    }
  }
  return y;
}
const rv = [reverb(send[0], 0), reverb(send[1], 23)];
const mix = [0, 1].map((c) =>
  dry[c].map((v, i) => Math.tanh((v + rv[c][i] * 0.45) * 1.25)),
);
let peak = 0;
for (const ch of mix) for (const v of ch) peak = Math.max(peak, Math.abs(v));
const gain = 0.89 / peak;
// micro fades so the loop point never clicks
for (const ch of mix)
  for (let i = 0; i < 240; i++) {
    ch[i] *= i / 240;
    ch[N - 1 - i] *= i / 240;
  }

const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++)
  for (let c = 0; c < 2; c++)
    buf.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, mix[c][i] * gain)) * 32767),
      44 + i * 4 + c * 2,
    );
fs.writeFileSync(__dirname + "/audio.wav", buf);
console.log(
  `audio.wav  peak(pre-norm)=${peak.toFixed(3)}  gain=${gain.toFixed(3)}`,
);
