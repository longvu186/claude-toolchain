// Deterministic motion helpers: every function is a pure function of time t (seconds).
// UMD-style: works via <script> (window.Motion) and require() in Node (for tests).
(function (root) {
  // Closed-form damped spring step response 0 -> 1, dt seconds after the step. Handles under/critical/over-damped.
  // Config is physical (mass, stiffness k, damping c); zeta = c / (2*sqrt(k*m)). See references/motion-craft.md.
  function springStep(dt, cfg) {
    const { stiffness = 380, damping = 31.2, mass = 1 } = cfg || {};
    if (dt <= 0) return 0;
    const w0 = Math.sqrt(stiffness / mass), z = damping / (2 * Math.sqrt(stiffness * mass));
    if (Math.abs(z - 1) < 1e-6) return 1 - Math.exp(-w0 * dt) * (1 + w0 * dt);
    if (z < 1) {
      const wd = w0 * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w0 * dt) * (Math.cos(wd * dt) + ((z * w0) / wd) * Math.sin(wd * dt));
    }
    const s = Math.sqrt(z * z - 1), r1 = -w0 * (z - s), r2 = -w0 * (z + s);
    return 1 + (r2 * Math.exp(r1 * dt) - r1 * Math.exp(r2 * dt)) / (r1 - r2);
  }

  // A value that retargets many times, as a SUM of one spring per target change (linear superposition).
  // keys: [{t, v}, ...] sorted by t; keys[0].v is the initial value. Motion stays continuous across
  // retargets and the whole thing is still a pure function of t (seekable in any order).
  function springTrack(t, keys, cfg) {
    let v = keys[0].v;
    for (let i = 1; i < keys.length; i++) v += (keys[i].v - keys[i - 1].v) * springStep(t - keys[i].t, cfg);
    return v;
  }

  // Stretchy indicator (tab underline, toggle knob): the edge on the side of travel rides a stiffer spring,
  // so it leads and the shape stretches, then the trailing edge catches up.
  // keys: [{t, left, right}]; returns {left, right}.
  function stretchyRange(t, keys, lead, trail) {
    lead = lead || { stiffness: 700, damping: 47.6 };
    trail = trail || { stiffness: 220, damping: 24 };
    let L = keys[0].left, R = keys[0].right;
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i], dir = Math.sign((b.left + b.right) - (a.left + a.right));
      const dt = t - b.t;
      L += (b.left - a.left) * springStep(dt, dir < 0 ? lead : trail);
      R += (b.right - a.right) * springStep(dt, dir > 0 ? lead : trail);
    }
    return { left: L, right: R };
  }

  // Seeded PRNG + Fisher-Yates (e.g. deterministic letter scramble that "snaps" on a beat).
  function mulberry32(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seededShuffle(arr, seed) {
    const a = arr.slice(), rnd = mulberry32(seed);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // Infinite zoom at constant perceived speed: zoom is exponential in time, so each segment's duration
  // is proportional to log(its zoom factor). zooms: per-segment scale factors; returns {starts, durations}.
  function logZoomSchedule(zooms, totalSeconds) {
    const logs = zooms.map(z => Math.log(z)), sum = logs.reduce((a, b) => a + b, 0);
    const durations = logs.map(l => (l / sum) * totalSeconds), starts = [];
    durations.reduce((acc, d) => (starts.push(acc), acc + d), 0);
    return { starts, durations };
  }
  // Camera scale within a segment of zoom factor Z at progress p in [0,1]: Z^p (constant log-speed).
  // Parallax layer at depth exponent zd: layerScale = cameraScale ** zd (0.45..1.22 for 3-layer collage).
  const zoomAt = (Z, p) => Math.pow(Z, p);

  // Animate "on twos" (or n's): quantize time so hand-made/cutout elements update at fps/n.
  const onTwos = (t, fps, n = 2) => Math.floor((t * fps) / n) * (n / fps);

  const api = { springStep, springTrack, stretchyRange, mulberry32, seededShuffle, logZoomSchedule, zoomAt, onTwos };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Motion = api;
})(typeof window !== 'undefined' ? window : globalThis);
