/* CLAUDE — MOTION REEL 2026
 * Deterministic canvas renderer: render(t) is a pure function of time, so frames can be
 * stepped, supersampled for motion blur, and rendered in parallel workers.
 */
const { W, H, FPS } = TL;
const CX = W / 2,
  CY = H / 2,
  TAU = Math.PI * 2;
const C = {
  ink: "#0B0B10",
  paper: "#F2EEE6",
  coral: "#FF4D2E",
  blue: "#2E5BFF",
  acid: "#D4FF3A",
  violet: "#9B5CFF",
};
const PAL = [C.coral, C.blue, C.acid, C.paper, C.violet];
const SUB = 8; // motion-blur subframes per output frame
const SHUTTER = 0.5; // 180° shutter, forward-facing so edit cuts stay frame-clean

const out = document.getElementById("c");
const octx = out.getContext("2d", { willReadFrequently: true });
const scene = document.createElement("canvas");
scene.width = W;
scene.height = H;
const ctx = scene.getContext("2d", { willReadFrequently: true });

// ── math ────────────────────────────────────────────────────────────────────────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutExpo: (t) =>
    t <= 0
      ? 0
      : t >= 1
        ? 1
        : t < 0.5
          ? Math.pow(2, 20 * t - 10) / 2
          : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: (t, s = 1.70158) =>
    1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
};
// damped harmonic spring 0 → 1 (overshoots), dt in seconds
function spring(dt, f = 4, z = 0.35) {
  if (dt <= 0) return 0;
  const w = TAU * f,
    wd = w * Math.sqrt(1 - z * z);
  return (
    1 -
    Math.exp(-z * w * dt) *
      (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt))
  );
}
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hit = (t, h, k = 10) => (t >= h ? Math.exp(-(t - h) * k) : 0);
const hitSum = (t, k) =>
  TL.HITS.reduce(
    (a, h) => a + hit(t, h, k) * (TL.BIG_HITS.includes(h) ? 1 : 0.5),
    0,
  );

// ── drawing primitives ──────────────────────────────────────────────────────────────
function bg(color) {
  ctx.fillStyle = color;
  ctx.fillRect(-200, -200, W + 400, H + 400);
}
function circle(x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, r), 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}
function ring(x, y, r, lw, stroke, alpha = 1) {
  if (r <= 0 || lw <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.restore();
}
function mono(size) {
  return `700 ${size}px Mono`;
}
function caption(
  text,
  x,
  y,
  t0,
  t,
  color = C.paper,
  size = 22,
  align = "left",
) {
  const n = Math.floor(clamp((t - t0) / 0.22) * text.length);
  if (n <= 0) return;
  ctx.save();
  ctx.font = mono(size);
  ctx.letterSpacing = "4px";
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text.slice(0, n) + (n < text.length ? "_" : ""), x, y);
  ctx.restore();
}

// Per-letter masked rise with spring overshoot — the core kinetic-type move.
function riseWord(
  word,
  font,
  cx,
  baseline,
  t,
  t0,
  stagger,
  color,
  f = 3.2,
  z = 0.42,
  rot = 0.3,
) {
  ctx.save();
  ctx.font = font;
  ctx.letterSpacing = "0px";
  const m = ctx.measureText(word),
    asc = m.actualBoundingBoxAscent,
    total = m.width;
  const x0 = cx - total / 2;
  for (let i = 0; i < word.length; i++) {
    const s = spring(t - (t0 + i * stagger), f, z);
    if (s <= 0) continue;
    const lx = x0 + ctx.measureText(word.slice(0, i)).width,
      lw = ctx.measureText(word[i]).width;
    ctx.save();
    ctx.beginPath();
    ctx.rect(lx - 30, baseline - asc - 60, lw + 60, asc + 90);
    ctx.clip();
    ctx.translate(lx + lw / 2, baseline + (1 - s) * (asc + 80));
    ctx.rotate((1 - s) * rot);
    ctx.fillStyle = color;
    ctx.fillText(word[i], -lw / 2, 0);
    ctx.restore();
  }
  ctx.restore();
  return { x0, total, asc };
}

// Punch-in word: scale + tracking collapse; hard cut to the next word.
function popWord(
  word,
  t,
  t0,
  size,
  color,
  comp = "source-over",
  font = "Archivo",
) {
  const p = E.outExpo(prog(t, t0, t0 + 0.18));
  ctx.save();
  ctx.globalCompositeOperation = comp;
  ctx.translate(CX, CY);
  const s = lerp(1.35, 1, p);
  ctx.scale(s, s);
  ctx.font = `${size}px ${font}`;
  ctx.letterSpacing = `${lerp(60, -4, p)}px`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(word, 0, size * 0.04);
  ctx.restore();
}

// ── transitions ─────────────────────────────────────────────────────────────────────
function slices(draw, p, n = 7) {
  const bh = H / n;
  for (let i = 0; i < n; i++) {
    const q = E.inExpo(clamp(p * 1.45 - i * 0.065));
    if (q >= 1) continue;
    const dir = i % 2 ? 1 : -1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-300, i * bh, W + 600, bh + 1);
    ctx.clip();
    ctx.translate(dir * q * (W + 400), 0);
    draw();
    ctx.fillStyle = C.coral;
    ctx.fillRect(dir > 0 ? -12 : W, i * bh, 12, bh + 1); // leading edge
    ctx.restore();
  }
}
function iris(draw, r, edge = C.coral) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, Math.max(0, r), 0, TAU);
  ctx.clip();
  draw();
  ctx.restore();
  ring(CX, CY, r, 10, edge);
}

// ── S1 · IGNITE (0 – 0.5) ───────────────────────────────────────────────────────────
function sIgnite(t) {
  bg(C.ink);
  ctx.strokeStyle = "rgba(242,238,230,0.09)";
  ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i++) {
    const g = E.outExpo(prog(t, 0.02 * Math.abs(i), 0.3 + 0.02 * Math.abs(i)));
    const x = CX + i * 120;
    ctx.beginPath();
    ctx.moveTo(x, CY - (g * H) / 2);
    ctx.lineTo(x, CY + (g * H) / 2);
    ctx.stroke();
  }
  for (let j = -4; j <= 4; j++) {
    const g = E.outExpo(prog(t, 0.03 * Math.abs(j), 0.3 + 0.03 * Math.abs(j)));
    const y = CY + j * 120;
    ctx.beginPath();
    ctx.moveTo(CX - (g * W) / 2, y);
    ctx.lineTo(CX + (g * W) / 2, y);
    ctx.stroke();
  }
  for (const p of [0.1, 0.22, 0.34]) {
    const q = prog(t, p, p + 0.3);
    if (q > 0 && q < 1)
      ring(CX, CY, 14 + E.outExpo(q) * 190, 2, C.paper, (1 - q) * 0.55);
  }
  const r = 14 * E.outBack(prog(t, 0.04, 0.2), 3);
  const sq = E.inOutCubic(prog(t, 0.26, 0.41));
  const st = E.inExpo(prog(t, 0.41, 0.5));
  const sx = lerp(1, 0.55, sq),
    sy = lerp(1, 1.55, sq);
  ctx.fillStyle = C.paper;
  if (st <= 0) {
    ctx.beginPath();
    ctx.ellipse(CX, CY, Math.max(0, r * sx), Math.max(0, r * sy), 0, 0, TAU);
    ctx.fill();
  } else {
    const len = lerp(r * sx * 2, 1900, st),
      th = lerp(r * sy * 2, 5, st);
    ctx.beginPath();
    ctx.roundRect(CX - len / 2, CY - th / 2, len, th, th / 2);
    ctx.fill();
  }
}

// ── S2 · BURST + KINETIC TYPE (0.5 – 1.5) ───────────────────────────────────────────
const SHARDS = (() => {
  const r = rng(7),
    a = [];
  for (let i = 0; i < 130; i++) {
    a.push({
      ang: r() * TAU,
      dist: 260 + Math.pow(r(), 0.6) * 1100,
      size: 5 + r() * 30,
      type: Math.floor(r() * 4),
      color: PAL[Math.floor(r() * PAL.length)],
      spin: (r() - 0.5) * 14,
      rot0: r() * TAU,
      k: 5 + r() * 4,
      drift: 20 + r() * 60,
    });
  }
  return a;
})();
function sBurst(t) {
  bg(C.ink);
  const dt = t - TL.BURST;
  // line halves fly off
  const off = E.outExpo(prog(t, 0.5, 0.82)) * 1500,
    th = lerp(5, 1, prog(t, 0.5, 0.8));
  ctx.fillStyle = C.paper;
  ctx.fillRect(CX - 950 - off, CY - th / 2, 950, th);
  ctx.fillRect(CX + off, CY - th / 2, 950, th);
  // shockwaves
  const q1 = prog(t, 0.5, 1.15),
    q2 = prog(t, 0.55, 1.25);
  ring(CX, CY, E.outExpo(q1) * 1350, 60 * (1 - q1) + 1, C.paper, 1 - q1);
  ring(CX, CY, E.outExpo(q2) * 1100, 26 * (1 - q2) + 1, C.coral, 1 - q2);
  // shards
  const fade = 1 - prog(t, 1.05, 1.45);
  for (const s of SHARDS) {
    const p = 1 - Math.exp(-dt * s.k);
    const d = s.dist * p + dt * s.drift;
    const x = CX + Math.cos(s.ang) * d,
      y = CY + Math.sin(s.ang) * d;
    const v = s.dist * s.k * Math.exp(-dt * s.k);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(x, y);
    const sz = s.size * lerp(0.4, 1, E.outExpo(clamp(dt * 6)));
    if (s.type === 3) {
      ctx.rotate(s.ang);
      ctx.fillStyle = s.color;
      const len = Math.min(260, 8 + v * 0.06);
      ctx.fillRect(-len, -1.5, len, 3);
    } else {
      ctx.rotate(s.rot0 + s.spin * dt);
      ctx.fillStyle = s.color;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (s.type === 0) {
        ctx.arc(0, 0, sz / 2, 0, TAU);
        ctx.fill();
      } else if (s.type === 1) {
        ctx.moveTo(0, -sz / 1.6);
        ctx.lineTo(sz / 1.9, sz / 3.2);
        ctx.lineTo(-sz / 1.9, sz / 3.2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.rect(-sz / 2, -sz / 2, sz, sz);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  // kinetic type
  const font = "300px Archivo",
    baseline = CY + 108;
  ctx.font = font;
  const wordW = ctx.measureText("MOTION").width,
    x0 = CX - wordW / 2;
  // stacked outline echoes
  const eo = E.outExpo(prog(t, 0.98, 1.3));
  if (eo > 0) {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.lineWidth = 2;
    for (let k = 1; k <= 3; k++)
      for (const dir of [-1, 1]) {
        ctx.globalAlpha = 0.75 / k;
        ctx.strokeStyle = k % 2 ? C.coral : C.blue;
        ctx.strokeText("MOTION", CX, baseline + dir * k * eo * 92);
      }
    ctx.restore();
  }
  // reveal bars (coral leads, blue trails)
  const bars = [
    [C.blue, 0.05],
    [C.coral, 0],
  ];
  for (const [col, lag] of bars) {
    const a = E.outExpo(prog(t, 0.52 + lag, 0.72 + lag)),
      b = E.inOutExpo(prog(t, 0.7 + lag, 0.92 + lag));
    const L = x0 - 40 + b * (wordW + 80),
      R = x0 - 40 + a * (wordW + 80);
    if (R > L) {
      ctx.fillStyle = col;
      ctx.fillRect(L, baseline - 240, R - L, 270);
    }
  }
  riseWord(
    "MOTION",
    font,
    CX,
    baseline,
    t,
    TL.MOTION_T0,
    TL.MOTION_STAGGER,
    C.paper,
  );
  caption("01 — KINETIC TYPE", x0, baseline + 90, 0.92, t, C.paper, 22);
}

// ── S3 · WAVE FIELD (1.5 – 2.5) ─────────────────────────────────────────────────────
function sWave(t) {
  bg(C.blue);
  const lt = t - 1.36,
    cols = 43,
    rows = 25,
    sp = 48;
  const sx = Math.cos(lt * 2.2) * 320,
    sy = Math.sin(lt * 1.6) * 160;
  const R = (t - 2.0) * 2000;
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(-0.12 + lt * 0.09);
  const paths = {
    [C.paper]: new Path2D(),
    [C.acid]: new Path2D(),
    [C.ink]: new Path2D(),
  };
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x = (i - (cols - 1) / 2) * sp,
        y = (j - (rows - 1) / 2) * sp,
        d = Math.hypot(x, y);
      const d0 = (d / 1300) * 0.28,
        ap = E.outBack(prog(lt, d0, d0 + 0.22), 2.2);
      if (ap <= 0) continue;
      const dx = x - sx,
        dy = y - sy,
        ds = Math.hypot(dx, dy) || 1;
      const v = Math.sin(ds * 0.017 - lt * 10);
      const boost =
        t >= 2.0
          ? Math.exp(-Math.pow((d - R) / 90, 2)) * Math.exp(-(t - 2.0) * 2)
          : 0;
      const push = v * 7 + boost * 26;
      const px = x + (dx / ds) * push,
        py = y + (dy / ds) * push;
      const r = (2.5 + 8.5 * (0.5 + 0.5 * v) + 12 * boost) * ap;
      const col = boost > 0.5 ? C.ink : v > 0.86 ? C.acid : C.paper;
      paths[col].moveTo(px + r, py);
      paths[col].arc(px, py, r, 0, TAU);
    }
  for (const col in paths) {
    ctx.fillStyle = col;
    ctx.fill(paths[col]);
  }
  ctx.restore();
  for (let k = TL.WAVE_WORDS.length - 1; k >= 0; k--) {
    const [w0, word] = TL.WAVE_WORDS[k];
    if (t >= w0) {
      ctx.save(); ctx.translate(14, 14); popWord(word, t, w0, 250, C.acid); ctx.restore();
      popWord(word, t, w0, 250, C.ink);
      break;
    }
  }
  caption("02 — RHYTHM & PHYSICS", 96, H - 150, 1.55, t, C.paper, 22);
}

// ── S4 · SHAPE MORPH (2.5 – 3.5) ────────────────────────────────────────────────────
const RAYS = 240;
function polyVerts(n, r, inner = 0) {
  const v = [],
    count = inner ? n * 2 : n;
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (TAU * i) / count,
      rr = inner && i % 2 ? inner : r;
    v.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return v;
}
function radial(verts) {
  // boundary distance along each ray (shapes are star-shaped about origin)
  const out = new Float32Array(RAYS);
  for (let k = 0; k < RAYS; k++) {
    const a = -Math.PI / 2 + (TAU * k) / RAYS,
      dx = Math.cos(a),
      dy = Math.sin(a);
    let best = Infinity;
    for (let i = 0; i < verts.length; i++) {
      const [x1, y1] = verts[i],
        [x2, y2] = verts[(i + 1) % verts.length];
      const ex = x2 - x1,
        ey = y2 - y1,
        den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const s = (x1 * ey - y1 * ex) / den,
        u = (x1 * dy - y1 * dx) / den;
      if (s > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = Math.min(best, s);
    }
    out[k] = best;
  }
  return out;
}
const SHAPES = [
  new Float32Array(RAYS).fill(1),
  radial(polyVerts(3, 1.32)),
  radial(polyVerts(4, 1.22)),
  radial(polyVerts(5, 1.3, 0.56)),
];
const SHAPE_NAMES = ["CIRCLE", "TRIANGLE", "SQUARE", "STAR"];
function morphState(t) {
  let r = SHAPES[0],
    idx = 0,
    rot = 0;
  TL.MORPH_BEATS.forEach((b, i) => {
    const e = spring(t - (b - 0.09), 3.4, 0.32);
    if (e > 0) {
      r = r.map((v, k) => lerp(v, SHAPES[i + 1][k], e));
      idx = i + 1;
    }
    rot += E.outBack(prog(t, b - 0.09, b + 0.14), 2) * (Math.PI / 2);
  });
  return { r, idx, rot };
}
function shapePath(r, R) {
  const p = new Path2D();
  for (let k = 0; k < RAYS; k++) {
    const a = -Math.PI / 2 + (TAU * k) / RAYS,
      d = r[k] * R;
    k
      ? p.lineTo(Math.cos(a) * d, Math.sin(a) * d)
      : p.moveTo(Math.cos(a) * d, Math.sin(a) * d);
  }
  p.closePath();
  return p;
}
function orbiters(t, front) {
  ctx.save();
  ctx.rotate(-0.38);
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * TAU + (t - 2.5) * 2.4,
      z = Math.sin(a);
    if (front !== z > 0) continue;
    const x = Math.cos(a) * 470,
      y = z * 470 * 0.3;
    circle(x, y, 3 + 5 * (z + 1), i % 3 ? C.paper : C.acid);
  }
  ctx.restore();
}
function sMorph(t) {
  bg(C.ink);
  const lt = t - TL.MORPH;
  const zoom = 1 + E.inExpo(prog(t, 3.36, 3.5)) * 9;
  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(zoom, zoom);
  // rotating dial
  ctx.save();
  ctx.rotate(lt * 0.6);
  ctx.strokeStyle = "rgba(242,238,230,0.22)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * TAU,
      l = i % 10 ? 10 : 26;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 520, Math.sin(a) * 520);
    ctx.lineTo(Math.cos(a) * (520 - l), Math.sin(a) * (520 - l));
    ctx.stroke();
  }
  ctx.setLineDash([4, 14]);
  ring(0, 0, 560, 2, "rgba(242,238,230,0.35)");
  ctx.setLineDash([]);
  ctx.restore();
  orbiters(t, false);
  const pulse = TL.MORPH_BEATS.reduce((a, b) => a + hit(t, b, 9), 0);
  const R = 250 * (1 + 0.1 * pulse) * E.outBack(prog(t, 2.42, 2.62), 1.4);
  // echo trail
  for (let k = 6; k >= 1; k--) {
    const st = morphState(t - k * 0.032);
    ctx.save();
    ctx.rotate(st.rot);
    ctx.globalAlpha = 0.9 - k * 0.12;
    ctx.lineWidth = 3;
    ctx.strokeStyle = PAL[k % PAL.length];
    const sc = 1 + k * 0.05;
    ctx.scale(sc, sc);
    ctx.stroke(shapePath(st.r, R));
    ctx.restore();
  }
  const st = morphState(t);
  ctx.save();
  ctx.rotate(st.rot);
  ctx.fillStyle = C.coral;
  ctx.fill(shapePath(st.r, R));
  ctx.rotate(-st.rot * 2.2);
  ctx.fillStyle = C.ink;
  ctx.fill(shapePath(st.r, R * 0.42));
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.paper;
  ctx.stroke(shapePath(st.r, R * 0.42));
  ctx.restore();
  orbiters(t, true);
  ctx.restore();
  if (zoom < 1.5) {
    caption("03 — SHAPE MORPH", 96, H - 150, 2.56, t, C.paper, 22);
    ctx.save();
    ctx.font = mono(22);
    ctx.letterSpacing = "4px";
    ctx.fillStyle = C.coral;
    ctx.textAlign = "right";
    ctx.fillText(`${SHAPE_NAMES[st.idx]} / 0${st.idx + 1}`, W - 96, H - 150);
    ctx.restore();
  }
}

// ── S5 · TUNNEL (3.5 – 4.25) ────────────────────────────────────────────────────────
const STREAKS = (() => {
  const r = rng(21),
    a = [];
  for (let i = 0; i < 90; i++)
    a.push({ a: r() * TAU, o: r(), c: PAL[Math.floor(r() * 4)] });
  return a;
})();
function sTunnel(t) {
  bg(C.ink);
  const lt = t - TL.TUNNEL,
    pos = lt * 1.1 + Math.pow(lt, 3) * 5.5,
    speed = 1.1 + 16.5 * lt * lt;
  ctx.save();
  ctx.translate(CX, CY);
  const N = 22;
  const rings = [];
  for (let i = 0; i < N; i++) {
    const u = i / N + pos,
      z = u - Math.floor(u),
      id = i + N * Math.floor(u);
    rings.push({ z, id });
  }
  rings.sort((a, b) => a.z - b.z);
  for (const { z, id } of rings) {
    const s = Math.pow(z, 3) * 2900 + 6;
    const alpha = clamp(z * 4) * (1 - prog(z, 0.93, 1));
    ctx.save();
    ctx.rotate(id * 0.21 + lt * 1.6);
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.5 + z * z * 34;
    ctx.strokeStyle = PAL[((id % 4) + 4) % 4];
    ctx.strokeRect(-s / 2, -s / 2, s, s);
    ctx.restore();
  }
  for (const k of STREAKS) {
    const u = k.o + pos * 1.4,
      z = u - Math.floor(u),
      r = Math.pow(z, 2) * 1500 + 30;
    const len = Math.min(700, (20 + r * 0.12) * speed * 0.35);
    ctx.save();
    ctx.rotate(k.a);
    ctx.globalAlpha = clamp(z * 3);
    ctx.fillStyle = k.c;
    ctx.fillRect(r, -1.5, len, 3);
    ctx.restore();
  }
  ctx.restore();
  // backing glow for legibility
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 520);
  g.addColorStop(0, "rgba(11,11,16,0.85)");
  g.addColorStop(1, "rgba(11,11,16,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let k = TL.TUNNEL_WORDS.length - 1; k >= 0; k--) {
    const [w0, word] = TL.TUNNEL_WORDS[k];
    if (t >= w0) {
      popWord(word, t, w0, 210, k === 2 ? C.acid : C.paper);
      break;
    }
  }
  caption("04 — SPEED RAMP", 96, H - 150, 3.55, t, C.paper, 22);
  // entry flash (match-cut from the coral zoom) + exit whiteout
  ctx.fillStyle = C.coral;
  ctx.globalAlpha = hit(t, 3.5, 16);
  ctx.fillRect(-200, -200, W + 400, H + 400);
  ctx.fillStyle = C.paper;
  ctx.globalAlpha = E.inCubic(prog(t, 4.08, 4.25));
  ctx.fillRect(-200, -200, W + 400, H + 400);
  ctx.globalAlpha = 1;
}

// ── S6 · LOCKUP (4.25 – 5.0) ────────────────────────────────────────────────────────
function sFinal(t) {
  bg(C.paper);
  const lt = t - TL.FINAL;
  // registration marks
  const m = E.outExpo(prog(lt, 0.02, 0.3)) * 46;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  for (const [x, y, sx, sy] of [
    [150, 150, 1, 1],
    [W - 150, 150, -1, 1],
    [150, H - 150, 1, -1],
    [W - 150, H - 150, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x, y + sy * m);
    ctx.lineTo(x, y);
    ctx.lineTo(x + sx * m, y);
    ctx.stroke();
  }
  // title with tracking collapse + per-letter rise
  const word = "CLAUDE",
    size = 236,
    ls = lerp(110, 4, E.outExpo(prog(lt, 0, 0.5)));
  ctx.save();
  ctx.font = `800 ${size}px Unb`;
  ctx.letterSpacing = "0px";
  const ws = [...word].map((ch) => ctx.measureText(ch).width);
  const total = ws.reduce((a, b) => a + b, 0) + ls * (word.length - 1);
  const asc = ctx.measureText(word).actualBoundingBoxAscent,
    baseline = CY + 50;
  let x = CX - total / 2;
  for (let i = 0; i < word.length; i++) {
    const s = spring(lt - i * 0.028, 3.4, 0.45);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 40, baseline - asc - 70, ws[i] + 80, asc + 100);
    ctx.clip();
    ctx.translate(x + ws[i] / 2, baseline + (1 - s) * (asc + 90));
    ctx.rotate((1 - s) * -0.25);
    ctx.fillStyle = C.ink;
    ctx.fillText(word[i], -ws[i] / 2, 0);
    ctx.restore();
    x += ws[i] + ls;
  }
  ctx.restore();
  // accent dot (period) pops on after the title lands
  circle(
    CX + total / 2 + 44,
    baseline - 20,
    24 * E.outBack(prog(lt, 0.2, 0.36), 3),
    C.coral,
  );
  // underline draws from center
  const ul = E.outExpo(prog(lt, 0.1, 0.42)) * (total / 2 + 60);
  ctx.fillStyle = C.coral;
  ctx.fillRect(CX - ul, baseline + 44, ul * 2, 8);
  // typed subtitle with block cursor
  const n = Math.floor(prog(t, TL.SUB_T0, TL.SUB_T1) * TL.SUBTITLE.length);
  ctx.save();
  ctx.font = mono(30);
  ctx.letterSpacing = "8px";
  ctx.textAlign = "center";
  ctx.fillStyle = C.ink;
  const full = ctx.measureText(TL.SUBTITLE).width;
  ctx.textAlign = "left";
  const sx = CX - full / 2,
    sub = TL.SUBTITLE.slice(0, n);
  ctx.fillText(sub, sx, baseline + 128);
  if (lt > 0.1 && Math.floor(lt * 8) % 2 === 0)
    ctx.fillRect(sx + ctx.measureText(sub).width + 2, baseline + 102, 18, 32);
  ctx.restore();
  ctx.save();
  ctx.font = mono(20);
  ctx.letterSpacing = "6px";
  ctx.fillStyle = C.coral;
  ctx.textAlign = "center";
  ctx.globalAlpha = E.outCubic(prog(lt, 0.25, 0.4));
  ctx.fillText("SELECTED WORK — AVAILABLE FOR HIRE", CX, baseline - asc - 70);
  ctx.restore();
}

// ── compositor ──────────────────────────────────────────────────────────────────────
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const sh = TL.HITS.reduce(
    (a, h) => a + hit(t, h, 9) * (TL.BIG_HITS.includes(h) ? 28 : 12),
    0,
  );
  ctx.translate(CX, CY);
  ctx.rotate(sh * 0.0012 * Math.sin(t * 61));
  ctx.translate(-CX, -CY);
  ctx.translate(
    sh * Math.sin(t * 97.3) * Math.cos(t * 41.1),
    sh * Math.sin(t * 83.7 + 1.3),
  );
  if (t < TL.BURST) sIgnite(t);
  else if (t < TL.WAVE) {
    if (t < 1.3) sBurst(t);
    else {
      sWave(t);
      slices(() => sBurst(t), prog(t, 1.3, 1.5));
    }
  } else if (t < TL.MORPH) {
    sWave(t);
    if (t >= 2.3) iris(() => sMorph(t), E.inOutExpo(prog(t, 2.3, 2.5)) * 1150);
  } else if (t < TL.TUNNEL) sMorph(t);
  else if (t < TL.FINAL) sTunnel(t);
  else if (t < TL.CLOSE) sFinal(t);
  else {
    // iris-close back down to the opening dot → seamless loop
    bg(C.ink);
    const p = prog(t, TL.CLOSE, 4.92),
      Rc =
        lerp(1150, 14, E.inOutExpo(p)) * (1 - E.inCubic(prog(t, 4.92, 4.985)));
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, Math.max(0, Rc), 0, TAU);
    ctx.clip();
    const k = lerp(1, 0.35, E.inOutExpo(p));
    ctx.translate(CX, CY);
    ctx.scale(k, k);
    ctx.translate(-CX, -CY);
    sFinal(t);
    ctx.restore();
  }
}

// ── post: motion-blur accumulate → chromatic split → grain → vignette → HUD ────────
const acc = new Uint16Array(W * H * 4);
const GRAIN = [0, 1, 2, 3].map((s) => {
  const c = document.createElement("canvas");
  c.width = W / 2;
  c.height = H / 2;
  const g = c.getContext("2d"),
    id = g.createImageData(c.width, c.height),
    r = rng(100 + s);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 128 + (r() - 0.5) * 255;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  return c;
});
const SEQ = [
  [TL.FINAL, 6],
  [TL.TUNNEL, 5],
  [TL.MORPH, 4],
  [TL.WAVE, 3],
  [TL.BURST, 2],
  [0, 1],
];
function hud(f, t) {
  const a = Math.min(E.outCubic(prog(t, 0.05, 0.3)), 1 - prog(t, 4.7, 4.85));
  if (a <= 0) return;
  octx.save();
  octx.globalAlpha = a * 0.85;
  octx.globalCompositeOperation = "difference";
  octx.fillStyle = "#E8E8E8";
  octx.strokeStyle = "#E8E8E8";
  octx.font = mono(17);
  octx.letterSpacing = "3px";
  const s = Math.floor(f / FPS),
    ff = String(f % FPS).padStart(2, "0");
  octx.fillText("CLAUDE / MOTION REEL 26", 64, 76);
  octx.fillText(`TC 00:00:0${s}:${ff}`, 64, H - 60);
  octx.textAlign = "right";
  const seq = SEQ.find(([s0]) => t >= s0)[1];
  octx.fillText(
    `SEQ 0${seq}/06   F ${String(f).padStart(3, "0")}/300`,
    W - 64,
    H - 60,
  );
  octx.fillText("REC", W - 64, 76);
  if (Math.floor(t * 2) % 2 === 0) {
    octx.beginPath();
    octx.arc(W - 128, 70, 7, 0, TAU);
    octx.fillStyle = "#FF4D2E";
    octx.globalCompositeOperation = "source-over";
    octx.fill();
    octx.globalCompositeOperation = "difference";
    octx.fillStyle = "#E8E8E8";
  }
  octx.fillRect(64, H - 44, (W - 128) * (f / 299), 2);
  octx.globalAlpha = a * 0.3;
  octx.fillRect(64, H - 44, W - 128, 1);
  octx.restore();
}
window.renderFrame = function (f) {
  acc.fill(0);
  for (let s = 0; s < SUB; s++) {
    const t = (f + (s / SUB) * SHUTTER) / FPS;
    render(t);
    const d = ctx.getImageData(0, 0, W, H).data;
    for (let i = 0; i < d.length; i++) acc[i] += d[i];
  }
  const t = f / FPS;
  const img = octx.createImageData(W, H),
    o = img.data;
  const ca = Math.round(
    TL.HITS.reduce(
      (a, h) => a + hit(t, h, 11) * (TL.BIG_HITS.includes(h) ? 16 : 7),
      0,
    ),
  );
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = (row + x) * 4;
      const ir = ca ? (row + Math.max(0, x - ca)) * 4 : i,
        ib = ca ? (row + Math.min(W - 1, x + ca)) * 4 : i;
      o[i] = acc[ir] / SUB;
      o[i + 1] = acc[i + 1] / SUB;
      o[i + 2] = acc[ib + 2] / SUB;
      o[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  octx.save();
  octx.globalCompositeOperation = "overlay";
  octx.globalAlpha = 0.085;
  octx.drawImage(GRAIN[f % 4], 0, 0, W, H);
  octx.restore();
  const v = octx.createRadialGradient(CX, CY, H * 0.35, CX, CY, H * 1.05);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.3)");
  octx.fillStyle = v;
  octx.fillRect(0, 0, W, H);
  hud(f, t);
  return out.toDataURL("image/png").split(",")[1];
};
window.ready = Promise.all(
  ["300px Archivo", "700 20px Mono", "800 200px Unb"].map((f) =>
    document.fonts.load(f),
  ),
).then(() => true);

// Frame contract for scripts/render-frames.mjs
window.FRAMES = TL.FPS * TL.DUR;
