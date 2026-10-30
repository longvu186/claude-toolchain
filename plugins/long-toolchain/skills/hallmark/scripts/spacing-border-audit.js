// Hallmark · spacing & border audit — measures the RENDERED page, not the source.
// Rules and thresholds adapted from Impeccable's detector (pbakaus/impeccable,
// Apache-2.0, crates/core checks: cramped-padding, heading-rhythm,
// monotonous-spacing, gpt-thin-border-wide-shadow, side-tab,
// border-accent-on-rounded, nested-cards, body-text-viewport-edge), rewritten
// as one dependency-free function for Playwright `page.evaluate()` or a
// DevTools console. See references/spacing-and-borders.md for the why.
//
// Usage (Playwright):
//   const audit = fs.readFileSync(`${HALLMARK}/scripts/spacing-border-audit.js`, "utf8");
//   const findings = await page.evaluate(`(${audit})()`);
// Usage (console): paste the file, then run `hallmarkSpacingAudit()`.
//
// Returns { findings: [{ gate, rule, where, detail }], stats }. Run it at 375
// and 1280 px — several rules only fail at one width.
function hallmarkSpacingAudit(opts) {
  const o = Object.assign({ maxFindingsPerRule: 8 }, opts || {});
  const out = [];
  const counts = {};
  const push = (gate, rule, el, detail) => {
    counts[rule] = (counts[rule] || 0) + 1;
    if (counts[rule] > o.maxFindingsPerRule) return;
    out.push({ gate, rule, where: describe(el), detail });
  };

  // ---------- helpers ----------
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0)
      return false;
    const r = el.getBoundingClientRect();
    // Horizontally off-canvas content (a closed drawer translated out of
    // view) is not on the page; content merely below the fold still is.
    if (r.right <= 0 || r.left >= innerWidth) return false;
    return r.width > 0 && r.height > 0;
  };
  // Selection / current-item indicators are allowed to carry a stripe —
  // the stripe IS the state (Impeccable exempts these the same way).
  const isStateIndicator = (el) =>
    el.closest(
      '[aria-current]:not([aria-current="false"]), [aria-selected="true"], [data-state="active"], [data-state="selected"], .is-selected, .is-active, .active',
    ) !== null;
  // Screen-reader-only text (`.sr-only`: 1px box, clip / clip-path) is not
  // on screen; measuring it reports text "past the edge" that nobody sees.
  const visuallyHidden = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      if (s.position === "absolute" && (r.width <= 1 || r.height <= 1)) return true;
      if (s.clip && s.clip !== "auto") return true;
      if (s.clipPath && /inset\(50%/.test(s.clipPath)) return true;
    }
    return false;
  };
  const textBox = (el) => {
    let l = Infinity,
      t = Infinity,
      r = -Infinity,
      b = -Infinity,
      n = 0;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (w.nextNode() && n < 80) {
      if (!w.currentNode.textContent.trim()) continue;
      if (visuallyHidden(w.currentNode.parentElement)) continue;
      const range = document.createRange();
      range.selectNodeContents(w.currentNode);
      for (const rr of range.getClientRects()) {
        if (rr.width < 1) continue;
        l = Math.min(l, rr.left);
        t = Math.min(t, rr.top);
        r = Math.max(r, rr.right);
        b = Math.max(b, rr.bottom);
        n++;
      }
    }
    return n ? { left: l, top: t, right: r, bottom: b } : null;
  };
  function describe(el) {
    if (!el || !el.tagName) return "page";
    let d = el.tagName.toLowerCase();
    if (el.id) d += "#" + el.id;
    const cls =
      typeof el.className === "string"
        ? el.className.trim().split(/\s+/).slice(0, 3)
        : [];
    if (cls.length && cls[0]) d += "." + cls.join(".");
    const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return txt ? `${d} "${txt}"` : d;
  }
  const parseColor = (c) => {
    const m = (c || "").match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1]
      .split(/[ ,/]+/)
      .filter(Boolean)
      .map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const chroma = (c) =>
    c ? (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) / 255 : 0;
  const sideBorder = (s, side) => {
    const w = parseFloat(s[`border${side}Width`]) || 0;
    const style = s[`border${side}Style`];
    const col = parseColor(s[`border${side}Color`]);
    const shows =
      w >= 0.5 && style !== "none" && style !== "hidden" && col && col.a > 0.05;
    return { w: shows ? w : 0, col };
  };
  const shadowLayers = (v) => {
    if (!v || v === "none") return [];
    // split on commas not inside parentheses
    const layers = [];
    let depth = 0,
      cur = "";
    for (const ch of v) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        layers.push(cur);
        cur = "";
      } else cur += ch;
    }
    layers.push(cur);
    return layers
      .map((l) => {
        const col = parseColor(l);
        const nums =
          l
            .replace(/rgba?\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]+/gi, "")
            .match(/-?[\d.]+px/g) || [];
        const [x, y, blur, spread] = nums.map(parseFloat).concat([0, 0, 0, 0]);
        return {
          x,
          y,
          blur,
          spread,
          alpha: col ? col.a : 1,
          inset: /inset/.test(l),
        };
      })
      .filter((l) => !l.inset && l.alpha > 0.03);
  };
  const effectiveBg = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const c = parseColor(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const sameColor = (a, b) =>
    a &&
    b &&
    Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 8;
  // A visible boundary: border on ≥1 side, an offset/blurred shadow, or a fill
  // that differs from what is painted under it.
  const boundary = (el) => {
    const s = getComputedStyle(el);
    const sides = ["Top", "Right", "Bottom", "Left"].map(
      (x) => sideBorder(s, x).w,
    );
    const shadow = shadowLayers(s.boxShadow).some(
      (l) => l.blur > 0 || l.x || l.y || l.spread,
    );
    const fill = parseColor(s.backgroundColor);
    const parentBg = el.parentElement ? effectiveBg(el.parentElement) : null;
    const filled = fill && fill.a > 0.2 && !sameColor(fill, parentBg);
    return {
      sides,
      shadow,
      filled,
      any: sides.some((w) => w > 0) || shadow || filled,
    };
  };
  const isCard = (el) => {
    const b = boundary(el);
    const r = el.getBoundingClientRect();
    const rounded = parseFloat(getComputedStyle(el).borderTopLeftRadius) >= 4;
    return (
      r.width >= 120 &&
      r.height >= 60 &&
      (b.sides.filter((w) => w > 0).length >= 3 || b.shadow) &&
      (rounded || b.shadow)
    );
  };
  const SKIP = new Set([
    "SCRIPT",
    "STYLE",
    "SVG",
    "PATH",
    "INPUT",
    "TEXTAREA",
    "SELECT",
    "OPTION",
    "IMG",
    "VIDEO",
    "CANVAS",
    "IFRAME",
    "BR",
    "HR",
  ]);
  const all = [...document.body.querySelectorAll("*")].filter(
    (el) => !SKIP.has(el.tagName.toUpperCase()) && visible(el),
  );

  // ---------- gate 59 · cramped padding ----------
  // Text closer to a visible container edge than max(8px, .5em) horizontally
  // or max(4px, .3em) vertically. Measures the text's own line boxes.
  for (const el of all) {
    const b = boundary(el);
    if (!b.any) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 16) continue;
    const s = getComputedStyle(el);
    const fs = parseFloat(s.fontSize) || 16;
    const bw = ["Top", "Right", "Bottom", "Left"].map(
      (x) => sideBorder(s, x).w,
    );
    const inner = {
      top: r.top + bw[0],
      right: r.right - bw[1],
      bottom: r.bottom - bw[2],
      left: r.left + bw[3],
    };
    // text nodes that belong to this box (not to a nested boxed descendant)
    let tl = Infinity,
      tt = Infinity,
      tr = -Infinity,
      tb = -Infinity,
      n = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode() && n < 60) {
      const t = walker.currentNode;
      if (!t.textContent.trim()) continue;
      let owner = t.parentElement,
        nested = false;
      while (owner && owner !== el) {
        if (boundary(owner).any) {
          nested = true;
          break;
        }
        owner = owner.parentElement;
      }
      if (nested || !t.parentElement || !visible(t.parentElement) || visuallyHidden(t.parentElement)) continue;
      const range = document.createRange();
      range.selectNodeContents(t);
      for (const rr of range.getClientRects()) {
        if (rr.width < 1) continue;
        tl = Math.min(tl, rr.left);
        tt = Math.min(tt, rr.top);
        tr = Math.max(tr, rr.right);
        tb = Math.max(tb, rr.bottom);
        n++;
      }
    }
    if (!n) continue;
    const hMin = Math.max(8, fs * 0.5),
      vMin = Math.max(4, fs * 0.3);
    const gaps = {
      left: tl - inner.left,
      right: inner.right - tr,
      top: tt - inner.top,
      bottom: inner.bottom - tb,
    };
    // only edges that actually paint (a fill paints all four; a border only its own side)
    const paints = {
      top: b.filled || b.shadow || bw[0] > 0,
      right: b.filled || b.shadow || bw[1] > 0,
      bottom: b.filled || b.shadow || bw[2] > 0,
      left: b.filled || b.shadow || bw[3] > 0,
    };
    const bad = Object.entries(gaps).filter(
      ([side, g]) =>
        paints[side] &&
        g > -2 &&
        g < (side === "left" || side === "right" ? hMin : vMin),
    );
    if (bad.length)
      push(
        59,
        "cramped-padding",
        el,
        bad
          .map(
            ([s, g]) =>
              `${s} ${g.toFixed(1)}px < ${(s === "left" || s === "right" ? hMin : vMin).toFixed(1)}px`,
          )
          .join(", "),
      );
  }

  // ---------- gate 60 · body text against the viewport edge ----------
  const edgeMin = innerWidth <= 480 ? 12 : 16;
  for (const p of document.querySelectorAll("p, li, dd, blockquote")) {
    if (!visible(p) || (p.textContent || "").trim().length < 20) continue;
    // Measure where the glyphs land, not the box: a label with its own
    // padding is fine even when its box touches the edge.
    const r = textBox(p);
    if (!r) continue;
    if (r.left < edgeMin - 0.5 || innerWidth - r.right < edgeMin - 0.5)
      push(
        60,
        "body-text-viewport-edge",
        p,
        `text starts ${r.left.toFixed(0)}px / ends ${(innerWidth - r.right).toFixed(0)}px from the edge, floor ${edgeMin}px`,
      );
  }

  // ---------- gate 61 · heading rhythm ----------
  // A heading binds to what follows: space above must exceed space below.
  let rhythmBad = [];
  for (const h of document.querySelectorAll("h1, h2, h3, h4")) {
    if (!visible(h)) continue;
    const prev = (() => {
      let s = h.previousElementSibling;
      while (s && !visible(s)) s = s.previousElementSibling;
      return s;
    })();
    const next = (() => {
      let s = h.nextElementSibling;
      while (s && !visible(s)) s = s.nextElementSibling;
      return s;
    })();
    if (!prev || !next) continue;
    const hr = h.getBoundingClientRect(),
      pr = prev.getBoundingClientRect(),
      nr = next.getBoundingClientRect();
    if (pr.bottom > hr.top + 1 || nr.top < hr.bottom - 1) continue; // side-by-side, not stacked
    const above = hr.top - pr.bottom,
      below = nr.top - hr.bottom;
    if (below > 160) continue;
    if (below - above >= 12) rhythmBad.push([h, above, below]);
  }
  if (rhythmBad.length >= 2)
    for (const [h, a, b] of rhythmBad)
      push(
        61,
        "heading-rhythm",
        h,
        `above ${a.toFixed(0)}px ≤ below ${b.toFixed(0)}px`,
      );

  // ---------- gate 62 · monotonous spacing ----------
  const vals = [];
  for (const el of all) {
    const s = getComputedStyle(el);
    for (const k of [
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "marginTop",
      "marginBottom",
      "rowGap",
      "columnGap",
    ]) {
      const v = parseFloat(s[k]);
      if (v > 0 && v < 200) vals.push(Math.round(v / 4) * 4);
    }
  }
  const freq = {};
  vals.forEach((v) => (freq[v] = (freq[v] || 0) + 1));
  const uniq = Object.keys(freq).length;
  const [domV, domN] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0] || [
    0, 0,
  ];
  if (vals.length >= 10 && domN / vals.length > 0.6 && uniq <= 3)
    push(
      62,
      "monotonous-spacing",
      null,
      `~${domV}px is ${Math.round((100 * domN) / vals.length)}% of ${vals.length} spacing values (${uniq} distinct)`,
    );

  // ---------- gate 63 · borders: side-stripe, accent-on-rounded, ghost row, nested cards ----------
  for (const el of all) {
    if (isStateIndicator(el)) continue;
    const s = getComputedStyle(el);
    // A stripe drawn as an inset shadow (`inset 3px 0 0 <colour>`) is the
    // same tell as a border-left stripe.
    for (const layer of (s.boxShadow || "").split(/,(?![^(]*\))/)) {
      if (!/inset/.test(layer)) continue;
      const nums = (layer.replace(/rgba?\([^)]*\)/g, "").match(/-?[\d.]+px/g) || []).map(parseFloat);
      const [x = 0, y = 0, blur = 0] = nums;
      const col = parseColor(layer);
      if (Math.abs(x) >= 2 && Math.abs(x) <= 6 && y === 0 && blur === 0 && col && col.a > 0.3 && chroma(col) >= 0.15 && el.getBoundingClientRect().height >= 24)
        push(63, "side-stripe", el, `${Math.abs(x)}px coloured inset-shadow stripe on the ${x > 0 ? "left" : "right"}`);
    }
    const sides = ["Top", "Right", "Bottom", "Left"].map((x) =>
      sideBorder(s, x),
    );
    const thick = sides
      .map((b, i) => [i, b])
      .filter(([, b]) => b.w >= 2 && b.w <= 6 && chroma(b.col) >= 0.15);
    const others = sides.filter((b) => b.w > 1).length;
    if (thick.length === 1 && others === 1 && [1, 3].includes(thick[0][0])) {
      const r = el.getBoundingClientRect();
      if (r.height >= 24) {
        const rounded =
          parseFloat(s.borderTopLeftRadius) >= 4 ||
          parseFloat(s.borderTopRightRadius) >= 4;
        push(
          63,
          rounded ? "border-accent-on-rounded" : "side-stripe",
          el,
          `${sides[thick[0][0]].w}px coloured ${thick[0][0] === 3 ? "left" : "right"} border${rounded ? " on a rounded box" : ""}`,
        );
      }
    }
  }
  // ghost row: ≥3 sibling cards each with hairline border + soft shadow blur ≥32px
  const parents = new Set(all.map((el) => el.parentElement).filter(Boolean));
  for (const p of parents) {
    const kids = [...p.children].filter(visible);
    if (kids.length < 3) continue;
    const ghost = kids.filter((k) => {
      const s = getComputedStyle(k);
      const hair = ["Top", "Right", "Bottom", "Left"].some((x) => {
        const w = sideBorder(s, x).w;
        return w > 0 && w <= 1.5;
      });
      return hair && shadowLayers(s.boxShadow).some((l) => l.blur >= 32);
    });
    if (ghost.length >= 3)
      push(
        63,
        "ghost-card-row",
        p,
        `${ghost.length} siblings with hairline border + ≥32px soft shadow — pick border OR shadow`,
      );
  }
  // nested cards: a card whose nearest card-like ancestor is also a card
  const cards = all.filter(isCard);
  const cardSet = new Set(cards);
  for (const c of cards) {
    let a = c.parentElement;
    while (a && !cardSet.has(a)) a = a.parentElement;
    if (a && a !== document.body)
      push(63, "nested-cards", c, `inside ${describe(a).slice(0, 60)}`);
  }

  // ---------- gate 64 · radius scale ----------
  const radii = {};
  for (const el of all) {
    const v = parseFloat(getComputedStyle(el).borderTopLeftRadius);
    const r = el.getBoundingClientRect();
    if (!(v > 0) || v >= Math.min(r.width, r.height) / 2 - 0.5) continue; // pills and circles are their own shape
    radii[Math.round(v)] = (radii[Math.round(v)] || 0) + 1;
    if (r.width >= 240 && r.height >= 120 && v > 24)
      push(
        64,
        "over-rounded-surface",
        el,
        `${v}px radius on a ${Math.round(r.width)}×${Math.round(r.height)} surface (cards stay ≤ 16–20px)`,
      );
  }
  const radiusSteps = Object.keys(radii)
    .map(Number)
    .sort((a, b) => a - b);
  if (radiusSteps.length > 5)
    push(
      64,
      "radius-scale-drift",
      null,
      `${radiusSteps.length} distinct corner radii: ${radiusSteps.join(", ")}px — tokenize to ≤ 4 steps`,
    );

  return {
    findings: out,
    stats: {
      viewport: `${innerWidth}×${innerHeight}`,
      totalByRule: counts,
      spacingValues: vals.length,
      distinctSpacing: uniq,
      radiusSteps,
    },
  };
}
