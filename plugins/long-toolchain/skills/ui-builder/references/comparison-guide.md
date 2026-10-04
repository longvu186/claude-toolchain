# Visual Comparison Guide

## Comparison Methods

### Method 1: Playwright toHaveScreenshot (Recommended)

Best for automated regression testing in a test suite.

```ts
// playwright.config.ts — global screenshot settings
import { defineConfig } from '@playwright/test';
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 50,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
});
```

```ts
// tests/visual.spec.ts
import { test, expect } from '@playwright/test';

test('homepage matches design', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('home.png', {
    mask: [
      page.locator('[data-testid="timestamp"]'),
      page.locator('.user-avatar'),
    ],
    stylePath: './screenshot.css',
    fullPage: true,
  });
});
```

### Method 2: Standalone pixelmatch Script

Best for one-off comparisons or CI pipelines outside Playwright.

```bash
node ~/.copilot/skills/ui-builder/scripts/compare-screenshots.js \
  screenshots/reference/desktop-full.png \
  screenshots/current/desktop-full.png \
  screenshots/diffs/desktop-diff.png
```

### Method 3: Side-by-Side Manual Review

When automated comparison isn't sufficient:
1. Open reference and current images side by side
2. Toggle between them rapidly (blink comparison)
3. Note regions where elements jump or shift

## Masking Dynamic Content

Create a `screenshot.css` file to hide volatile elements:

```css
/* Hide timestamps, avatars, live indicators */
[data-dynamic], .timestamp, time, .relative-time { visibility: hidden !important; }
.avatar, .user-avatar, img[src*="avatar"] { visibility: hidden !important; }
iframe, video, .ad-container { visibility: hidden !important; }

/* Freeze animations */
*, *::before, *::after {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
}
```

## Reading Diff Images

Diff images from pixelmatch highlight differences in bright red/magenta:

- **Faint pink pixels**: Sub-pixel anti-aliasing differences (safe to ignore)
- **Bright red regions**: Actual content/layout differences (need fixing)
- **Large red blocks**: Entire sections shifted or missing

## Root Cause Analysis for Common Diffs

| Diff Pattern | Likely Cause | Fix |
|-------------|-------------|-----|
| Thin red lines around text | Font rendering difference | Accept if < 0.5%, or specify exact font-weight |
| Red block where image was | Image not loaded in time | Add `waitForLoadState('networkidle')` or mock images |
| Shifted content below a point | One element has different height | Check padding/margin/line-height of the element above |
| Color differences in a region | Wrong Tailwind color class | Compare computed color against extracted token |
| Border appears/disappears | Border-width or border-color mismatch | Check `border` vs `border-0` or missing `border-slate-200` |
| Shadow diff around cards | box-shadow mismatch | Compare `shadow-sm` vs `shadow-md` vs `shadow-lg` |
| Entire section offset | Missing or extra margin/padding | Check `py-*`, `my-*`, `gap-*` against design tokens |

## Setting Appropriate Thresholds

| Context | maxDiffPixels | threshold | When |
|---------|--------------|-----------|------|
| Pixel-perfect match required | 0 | 0.0 | Final parity validation |
| Standard parity check | 50 | 0.2 | During active development |
| Cross-browser tolerance | 200 | 0.3 | When comparing Chrome vs Firefox |
| Initial rough match | 500 | 0.4 | Early implementation phase |

## Multi-Breakpoint Comparison Strategy

1. Start with **Desktop (1440px)** — it's the most common reference dimension
2. Compare **Mobile (375px)** next — mobile layout differences are the biggest
3. Compare **Tablet (768px)** last — usually interpolated between desktop and mobile
4. Only compare **Wide (1920px)** if the design explicitly specifies it
