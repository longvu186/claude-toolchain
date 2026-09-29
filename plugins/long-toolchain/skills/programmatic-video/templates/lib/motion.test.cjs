const M = require('./motion.js');
const assert = require('assert'); let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const near = (a, b, e = 1e-3) => Math.abs(a - b) < e;
// 1. regimes: start 0, settle 1; overshoot matches theory e^(-zπ/√(1-z²))
for (const [name, cfg] of [['under z0.6', {stiffness: 800, damping: 33.94}], ['critical', {stiffness: 400, damping: 40}], ['over z2', {stiffness: 100, damping: 40}]]) {
  ok(M.springStep(0, cfg) === 0 && near(M.springStep(1e-9, cfg), 0), `${name} starts at 0`);
  ok(near(M.springStep(10, cfg), 1), `${name} settles to 1`);
  let peak = 0; for (let t = 0; t < 3; t += 1e-4) peak = Math.max(peak, M.springStep(t, cfg));
  const z = cfg.damping / (2 * Math.sqrt(cfg.stiffness)), theory = z < 1 ? Math.exp(-z * Math.PI / Math.sqrt(1 - z * z)) : 0;
  ok(near(peak - 1, theory, 2e-3) || (theory === 0 && peak <= 1 + 1e-9), `${name} overshoot ${(peak - 1).toFixed(4)} vs theory ${theory.toFixed(4)}`);
}
// 2. continuity across retargets: no jump bigger than normal per-sample motion
const keys = [{t: 0, v: 0}, {t: 0.2, v: 100}, {t: 0.35, v: -40}, {t: 0.5, v: 60}];
let prev = M.springTrack(0, keys), maxJump = 0;
for (let t = 1e-3; t < 2; t += 1e-3) { const v = M.springTrack(t, keys); maxJump = Math.max(maxJump, Math.abs(v - prev)); prev = v; }
ok(maxJump < 3, `springTrack continuous (max per-ms step ${maxJump.toFixed(3)})`);
ok(near(M.springTrack(5, keys), 60), 'springTrack settles on last target');
// 3. seek-order independence (pure function of t)
const ts = Array.from({length: 200}, (_, i) => i / 100), fwd = ts.map(t => M.springTrack(t, keys));
const shuffled = M.seededShuffle(ts.map((t, i) => i), 7); const rev = new Array(ts.length);
for (const i of shuffled) rev[i] = M.springTrack(ts[i], keys);
ok(fwd.every((v, i) => v === rev[i]), 'identical values when seeked in shuffled order');
// 4. stretchyRange: moving right, right edge leads so width grows mid-move, then returns to target width
const sk = [{t: 0, left: 0, right: 100}, {t: 0.1, left: 300, right: 400}];
const mid = M.stretchyRange(0.2, sk), end = M.stretchyRange(5, sk);
ok(mid.right - mid.left > 100, `stretches mid-move (width ${(mid.right - mid.left).toFixed(1)} > 100)`);
ok(near(end.left, 300) && near(end.right, 400), 'settles at target range');
const skL = [{t: 0, left: 300, right: 400}, {t: 0.1, left: 0, right: 100}], midL = M.stretchyRange(0.2, skL);
ok(midL.right - midL.left > 100 && midL.left < 300 - (400 - midL.right), 'moving left: left edge leads');
// 5. seeded shuffle deterministic + permutation
const a = M.seededShuffle([...'VIETNAM'], 42), b = M.seededShuffle([...'VIETNAM'], 42);
ok(a.join('') === b.join('') && a.slice().sort().join('') === [...'VIETNAM'].sort().join(''), 'seededShuffle deterministic permutation');
// 6. log-zoom schedule: durations ∝ log(z), sum = total; constant log-speed
const {starts, durations} = M.logZoomSchedule([8, 8, 64], 20);
ok(near(durations.reduce((x, y) => x + y, 0), 20) && near(durations[2], 2 * durations[0]), `logZoom durations ${durations.map(d => d.toFixed(2))}`);
ok(near(starts[1], durations[0]) && near(M.zoomAt(8, 0.5), Math.sqrt(8)), 'starts + zoomAt');
// 7. on twos
ok(M.onTwos(0.05, 30) === M.onTwos(0.04, 30) && M.onTwos(0.07, 30) > M.onTwos(0.05, 30), 'onTwos quantizes to 15 fps steps');
console.log(`PASS ${n} assertions`);
