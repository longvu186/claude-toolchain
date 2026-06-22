---
name: playwright-screenshot-comparison
description: "WORKFLOW SKILL - Capture, compare, and assert visual parity using Playwright screenshot workflows. Use for legacy app screenshot capture (Bubble auto-advance PIN, iconify-icon nav), rebuilt app capture, viewport/DPR standardization, pixelmatch diff pipelines, computed-style assertions, and visual regression in CI. Trigger phrases: Playwright screenshot, capture legacy, capture Bubble app, visual diff, pixelmatch, screenshot comparison, viewport DPR, visual regression, computed style assertion."
argument-hint: "Describe the two apps to compare, the pages/states to capture, or the visual assertion to write."
---

# Playwright Screenshot Comparison

Capture, compare, and assert visual parity between a legacy app and a rebuilt app using Playwright, with pixelmatch-based diff analysis.

## When to Use

- Capturing screenshots of a legacy Bubble.io app for visual reference
- Capturing screenshots of a rebuilt app for parity comparison
- Running pixelmatch diffs between screenshot sets
- Writing Playwright tests that assert computed CSS values against legacy specs
- Setting up visual regression in CI
- Debugging viewport/DPR mismatches between capture runs

## Capture Setup

### Viewport Standardization (Critical)

Both legacy and rebuilt captures MUST use identical settings:

```typescript
// playwright.config.ts — standardized viewports
const DESKTOP = { width: 1280, height: 720 }
const MOBILE  = { width: 375, height: 812 }

// For legacy Bubble apps, use DPR 1 for consistency
// Do NOT use fullPage: true for comparison — use viewport-sized captures
```

**Anti-pattern**: Using `fullPage: true` for one app but viewport-sized for the other. This produces images of wildly different heights, inflating diff percentages.

**Rule**: Use viewport-sized screenshots (no `fullPage`) unless explicitly comparing scrollable content areas.

### Screenshot Naming Convention

```
<app>-<route>-<state>-<viewport>.png

Examples:
  original/login-desktop.png
  current/login-desktop.png
  diff/login-desktop.png
```

Store in:
- `e2e/screenshots/original/` — legacy app captures
- `e2e/screenshots/current/` — rebuilt app captures
- `e2e/screenshots/diff/` — pixelmatch output

## Legacy Bubble App Capture

### Authentication Challenges

Bubble apps have unique auth UI patterns:

1. **Phone input**: May use custom placeholder text in Vietnamese
   ```typescript
   const phoneInput = page.locator(
     'input[placeholder*="Nhập số điện thoại"], input[placeholder*="phone"]'
   ).first()
   await phoneInput.fill(PHONE)
   ```

2. **PIN input with auto-advance**: Bubble PIN fields auto-advance focus on digit entry. Do NOT use `.fill()` on individual inputs — use keyboard press:
   ```typescript
   const firstPin = page.locator('input[placeholder="0"]').first()
   await firstPin.click()
   await page.waitForTimeout(200)
   for (const digit of PIN) {
     await page.keyboard.press(`Digit${digit}`)
     await page.waitForTimeout(400) // Wait for auto-advance
   }
   ```

3. **Login button**: May be a `<button>` or styled `<div>`:
   ```typescript
   const loginBtn = page.locator('button:has-text("Đăng nhập")')
   ```

4. **Post-login wait**: Bubble apps need generous timeouts after login:
   ```typescript
   await page.waitForTimeout(8000) // Bubble routing is slow
   ```

### Navigation Challenges

- **Mobile**: Bubble uses `iconify-icon` web components, not standard `<a>` or `<button>`:
  ```typescript
  const navIcons = page.locator('iconify-icon')
  await navIcons.nth(index).click({ force: true })
  await page.waitForTimeout(5000) // Bubble page transition
  ```

- **Desktop**: Sidebar uses text links in custom containers:
  ```typescript
  const navTargets = [
    { name: 'dashboard', texts: ['Dashboard', 'Thống kê'] },
    { name: 'leaderboard', texts: ['Leaderboard', 'Bảng xếp hạng'] },
  ]
  for (const target of navTargets) {
    for (const text of target.texts) {
      const link = page.locator(`text="${text}"`).first()
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await link.click()
        break
      }
    }
    await page.waitForTimeout(5000)
    await page.screenshot({ path: ssPath(target.name, false) })
  }
  ```

### Timing

Bubble apps are slow to render. Add generous waits:
- Page load: `waitForTimeout(5000)` after `goto`
- After login: `waitForTimeout(8000)`
- After navigation: `waitForTimeout(5000)`
- Before screenshot: `waitForTimeout(2000)` minimum

## Rebuilt App Capture

### Modern Vue/React App Patterns

```typescript
// Use networkidle + small buffer
await page.goto('/dashboard')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(2000)
await page.screenshot({ path: `${DIR}/dashboard-desktop.png` })
```

### Auth State Reuse

Use Playwright's `storageState` for authenticated captures:
```typescript
// In playwright.config.ts or test setup
test.use({ storageState: 'e2e/.auth/student.json' })

// For login page, override with empty state
const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
```

### Mobile Context

Create separate browser contexts for mobile viewports:
```typescript
const mobileCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  storageState: 'e2e/.auth/student.json',
})
const page = await mobileCtx.newPage()
```

### Route-Matrix Hero Consistency Audits

For marketing sites where above-the-fold consistency matters across many routes:

1. Define a fixed route matrix and run captures on both desktop and mobile viewports.
2. Freeze animation/transition noise before capture (inject CSS overrides for `animation` and `transition` durations).
3. Capture two artifacts per route:
  - `*.top.png` viewport capture for parity gates (primary signal for hero spacing/layout checks)
  - `*.png` full-page capture for diagnostics only (not a parity gate by default)
4. Run the same matrix against local and deployed URLs when validating release candidates.

### Focused Multi-Surface Regression Batches

When several screenshot-reported regressions land in one patch, prefer one focused spec that covers only the touched surfaces instead of rerunning a full parity matrix by default.

Pattern:
1. Scope tests to the changed routes or components only.
2. Use one canonical viewport per primary product context (mobile first for mobile-first products).
3. Assert the user-visible contract that mattered in the screenshots, then capture one canonical artifact per surface.
4. Keep selectors resilient (`getByRole`, `getByText`, `data-testid`) so style churn does not invalidate the regression gate.

Use this pattern when the goal is release confidence for a small batch of cross-view UI fixes, not broad design recertification.

### QA Probe Script Hygiene

For medium or complex browser QA probes, prefer a temporary `.mjs` script with cleanup over large inline `node -e` snippets, especially from PowerShell.

Pattern:
1. Put the probe in a short temporary file or existing validation script location.
2. Emit structured JSON with the exact assertions and observed values.
3. Run the script once, archive only useful artifacts, then remove the temporary file.
4. Use browser tooling directly when the main risk is interaction sequencing and shell quoting would dominate the work.

Avoid packing long selectors, template strings, and multi-step Playwright flows into a one-line shell command; quoting failures can look like app regressions.

### Data-Dependent Navigation Fallbacks

For progress-dependent lesson, intro, or workflow screens, do not rely on one brittle click path or hardcoded entity ID.

Pattern:
1. Try the real user navigation path first.
2. If the route or state does not resolve deterministically, inspect stable client-side state (for example IndexedDB, local persisted store data, or selected DOM context) to find a valid entity.
3. Navigate directly to the canonical route for that entity.
4. Assert the expected route/state after fallback.

Keep the fallback in a small helper function and use it only to stabilize test preconditions. It should not hide real navigation regressions; if the primary path unexpectedly fails, log that separately.

## Pixelmatch Comparison Pipeline

### Script Pattern

```javascript
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

// Read both PNGs
const orig = PNG.sync.read(fs.readFileSync(origPath))
const curr = PNG.sync.read(fs.readFileSync(currPath))

// Crop to overlap region (handle size mismatches)
const w = Math.min(orig.width, curr.width)
const h = Math.min(orig.height, curr.height)

// Compare with threshold
const diff = new PNG({ width: w, height: h })
const numDiff = pixelmatch(origData, currData, diff.data, w, h, { threshold: 0.15 })
const pct = ((numDiff / (w * h)) * 100).toFixed(1)
```

### Threshold Guidance

| Threshold | Use Case |
|-----------|----------|
| 0.10 | Strict — catches subtle color shifts |
| 0.15 | Standard — good balance for parity work |
| 0.20 | Lenient — for structural comparison only |

## Computed Style Assertions

Write Playwright tests that assert specific CSS values against legacy spec:

```typescript
const LEGACY = {
  colors: {
    brandTeal: 'rgb(22, 190, 207)',
    brandNavy: 'rgb(24, 47, 123)',
    brandGold: 'rgb(230, 160, 0)',
  },
  fonts: { heading: /Barlow/i, body: /Nunito/i },
}

// Assert color with tolerance
function colorClose(actual: string, expected: string): boolean {
  const parse = (c: string) => {
    const m = c.match(/(\d+),\s*(\d+),\s*(\d+)/)
    return m ? [+m[1], +m[2], +m[3]] : null
  }
  const a = parse(actual), e = parse(expected)
  if (!a || !e) return false
  return a.every((v, i) => Math.abs(v - e[i]) <= 2)
}

// Assert computed style
const bg = await page.locator('aside').evaluate(
  el => window.getComputedStyle(el).backgroundColor
)
expect(colorClose(bg, LEGACY.colors.brandNavy)).toBe(true)

// Assert font family
const font = await page.locator('h1').evaluate(
  el => window.getComputedStyle(el).fontFamily
)
expect(font).toMatch(LEGACY.fonts.heading)
```

## Common Pitfalls

| Pitfall | Impact | Fix |
|---------|--------|-----|
| `fullPage: true` on one, viewport on other | Diff % inflated, images incomparable | Never mix — standardize to viewport-sized |
| Different DPR between captures | Image dimensions differ by DPR multiplier | Force same DPR in both contexts |
| Missing `waitForTimeout` after Bubble nav | Screenshot captures mid-transition | Use 5000ms minimum after Bubble navigation |
| Capturing before fonts load | Text metrics differ | Wait for `networkidle` + buffer |
| Auth state leaking into login capture | Login page redirects away | Use fresh context with empty storageState |
| Bubble iconify-icon not clickable | Navigation fails silently | Use `{ force: true }` on click |
| Re-running full route matrix for a small UI batch | Slow/noisy validation, weaker signal | Write a focused touched-surface regression spec first |
| Hardcoding one lesson or entity ID in progress-dependent tests | Flaky routing or false failures across reseeds | Resolve a valid target from current client-side data before direct navigation |

## CI Integration

```yaml
# In CI, install browsers and run capture + compare
- run: npx playwright install chromium
- run: npx playwright test capture-current --project="Desktop Chrome"
- run: node e2e/compare-screenshots.mjs
- run: npx playwright test visual-parity --project="Desktop Chrome"
```

## Output Contract

When invoked, produce:
1. Standardized screenshot captures (named, sized, DPR-matched)
2. Pixelmatch diff images and percentage table
3. Per-page parity score
4. Actionable fix list sorted by severity
