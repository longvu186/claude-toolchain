# Spacing and borders — measured, not eyeballed

Load every build (universal rule set). Companion to [`layout-and-space.md`](layout-and-space.md), which sets the
scale and the asymmetry stance. This file turns spacing and edge treatment into **numbers you check on the rendered
page**, and ships a script that checks them: [`scripts/spacing-border-audit.js`](../scripts/spacing-border-audit.js).

Rules and thresholds adapted from Impeccable's detector (pbakaus/impeccable, Apache-2.0 — rules `cramped-padding`,
`body-text-viewport-edge`, `heading-rhythm`, `monotonous-spacing`, `side-tab`, `border-accent-on-rounded`,
`gpt-thin-border-wide-shadow`, `nested-cards`, and its craft-floor notes on elevation, radius and browser surfaces),
rewritten for Hallmark's token system and gates 59–64.

**Why measured:** source code lies about space. `p-4` on a chip whose text is `leading-tight`, a border that only
paints on one side, a shadow that turns a hairline card into a ghost — none of it is visible in the class list. Read
computed values or run the script; never sign off spacing from the source alone.

---

## 1 · Proximity before containers

Group by distance first. Add a border, fill or shadow only when distance alone cannot separate two groups.

- Related items: `--space-2xs`–`--space-sm` apart. Unrelated groups: at least 2 scale steps more.
- A divider (1px rule, `--rule-hairline`) separates items _inside_ one surface. A container separates _surfaces_.
  Reaching for a card where a divider or a gap would do is the most common edge mistake.
- **Never a card inside a card** (gate 63, `nested-cards`). Inside a surface, use dividers, a tinted row, or
  spacing. A fill-only tint (no border, no shadow) inside a card is fine — it is a row, not a card.

## 2 · Inset floors — text never touches a painted edge

Any box that paints an edge (border, fill different from its surface, or shadow) owes its text room. Measured
from the **glyph box** (the text's line boxes), not the padding value:

| Direction                 | Minimum                | Comfortable                          |
| ------------------------- | ---------------------- | ------------------------------------ |
| Horizontal (left/right)   | `max(8px, 0.5em)`      | 12–16px; 16–24px on cards            |
| Vertical (top/bottom)     | `max(4px, 0.3em)`      | 8–12px on controls; 16–24px on cards |
| Body text ↔ viewport edge | 16px (12px at ≤ 480px) | 24–32px                              |

- A border only owes inset on the side it paints. A fill or shadow owes it on all four.
- Chips and badges are not exempt — `py-0.5` on 12px text with a tinted fill is the usual offender.
- Scroller rows and tab panels: keep the **same inset on both sides** at rest. A card flush against the clip edge
  on one side and gutter on the other gets its corners cut off (`edge-flush-cards`).
- Gates 59 (inset) and 60 (viewport edge).

## 3 · Rhythm — space has to mean something

- **More space above a heading than below it.** A heading binds to the content it introduces. When it sits as
  close or closer to the block above, every section reads as a caption of the previous one. Rule of thumb:
  above ≥ 2× below; fail when below exceeds above by ≥ 12px on two or more headings (gate 61).
- **No single dominant value.** If more than 60% of the page's padding/margin/gap values are one number and there
  are 3 or fewer distinct values, the page is monotonous — tight groups and generous separations have collapsed
  into one gap (gate 62). Fix by stepping the scale: inner gaps down a step, section gaps up two.
- Repetition is fine where the content is genuinely equivalent (rows of a table, items of a list). Break it where
  priority changes, not for variety's sake.
- Density follows use: dashboards and tables (operate/read surfaces) earn tighter, stable spacing; landing and
  editorial pages (persuade) earn the large jumps.

## 4 · Borders — one edge language

- **Hairlines are 1px** (`--rule-hairline`), in a neutral token one step off the surface — never a saturated
  accent. Thick (≥ 2px) borders are reserved for state (focus, error, selected) and for genres that commit to
  them (Brutal).
- **No coloured side-stripe.** A 2–6px coloured `border-left/right` — or the same stripe as `inset Npx 0 0` box-shadow
  — on a card, callout, alert or list row is the most recognisable generated-UI tell (gate 63). On a **rounded** box
  it is worse: the straight stripe fights the curved corner (`border-accent-on-rounded`).
  - **Instead:** tint the whole surface (`--color-accent-subtle` fill), put a small icon or status word at the
    start, or use a full 1px border in the status colour.
  - **Allowed:** a stripe that _is_ a selection/current state — `[aria-current]`, `[aria-selected=true]`,
    `data-state=active`. The script skips these.
- **Declare elevation once: border OR shadow.** A hairline border under a wide soft shadow (blur ≥ 32px) is the
  "ghost card". One floating panel (popover, dialog) may wear both; a row of three or more cards wearing both is a
  default nobody chose (gate 63, `ghost-card-row`).
- Shadows carry an offset and a soft blur. A zero-offset coloured halo is decoration (see `anti-patterns.md`
  shadow-on-dark). A hard zero-blur offset shadow (`4px 4px 0`) belongs to Brutal only.

## 5 · Radius — a scale, not a feeling

Add a radius scale to `tokens.css` next to spacing. Four steps plus the two special shapes:

```css
:root {
  --radius-xs: 4px; /* chips, badges, tags, inline code */
  --radius-sm: 8px; /* buttons, inputs, menu items */
  --radius-md: 12px; /* cards, panels, popovers */
  --radius-lg: 16px; /* dialogs, sheets, large media */
  --radius-pill: 9999px; /* small controls only: toggles, segmented, avatar chips */
  --radius-none: 0; /* editorial / brutal genres commit to square */
}
```

- **≤ 4 radius steps per page** besides pill/circle (gate 64, `radius-scale-drift`). Eight slightly different
  corners is drift, not design.
- **Cards stay at 12–16px** (20px ceiling). A 24px+ radius on a large surface reads as a toy (`over-rounded-surface`).
  Pills are for small controls, never for cards or sections.
- **Concentric corners:** a rounded box inside a rounded box uses `inner = outer − padding` (clamp at
  `--radius-xs`). Equal radii on nested shapes make the inner corners look fatter.
- Genre overrides: Editorial/Brutal may run the whole page on `--radius-none` — then _every_ surface is square.
  Mixing square cards with 12px buttons is drift.

## 6 · Browser surfaces are part of the edge system

The parts the browser draws still ship. Theme them from the palette — the cheapest "this was built, not
assembled" signal:

```css
::selection {
  background: var(--color-accent-subtle);
  color: var(--color-ink);
}
:root {
  accent-color: var(--color-accent);
  caret-color: var(--color-accent);
}
* {
  scrollbar-color: var(--color-rule) transparent;
  scrollbar-width: thin;
}
a {
  text-underline-offset: 0.18em;
  text-decoration-thickness: 1px;
}
.tabular,
td,
[data-numeric] {
  font-variant-numeric: tabular-nums;
}
```

Focus rings follow `interaction-and-states.md` (instant, ≥ 3:1).

## 7 · Run the measurement

```js
// Playwright — run at 375 and 1280 px; several rules only fail at one width.
const audit = fs.readFileSync(
  `${HALLMARK_DIR}/scripts/spacing-border-audit.js`,
  "utf8",
);
const { findings, stats } = await page.evaluate(`(${audit})()`);
```

Each finding carries its gate number (59–64), the element, and the measured value (`left 2px < 8px`). Treat every
finding as a failing gate unless it is one of the documented exemptions above; record intentional exceptions in the
stamp (`spacing: pass (59–64) · waived: 63 nav stripe = aria-current`).

The script is a floor, not a verdict: a clean run cannot prove rhythm or hierarchy. Still squint at the render —
primary, secondary and the major groups should read in order with the detail blurred.
