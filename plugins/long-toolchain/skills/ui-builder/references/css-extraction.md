# CSS Extraction Reference

## Extracting from Live Pages with Playwright

### Full Component Style Dump

```ts
const componentStyles = await page.evaluate((selector) => {
  const el = document.querySelector(selector);
  if (!el) return null;
  const s = getComputedStyle(el);
  
  return {
    // Layout
    display: s.display,
    position: s.position,
    flexDirection: s.flexDirection,
    flexWrap: s.flexWrap,
    justifyContent: s.justifyContent,
    alignItems: s.alignItems,
    gap: s.gap,
    gridTemplateColumns: s.gridTemplateColumns,
    
    // Sizing
    width: s.width,
    height: s.height,
    minWidth: s.minWidth,
    maxWidth: s.maxWidth,
    minHeight: s.minHeight,
    maxHeight: s.maxHeight,
    
    // Spacing
    padding: s.padding,
    margin: s.margin,
    
    // Typography
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    textAlign: s.textAlign,
    textTransform: s.textTransform,
    textDecoration: s.textDecoration,
    
    // Colors
    color: s.color,
    backgroundColor: s.backgroundColor,
    
    // Borders
    border: s.border,
    borderRadius: s.borderRadius,
    
    // Effects
    boxShadow: s.boxShadow,
    opacity: s.opacity,
    overflow: s.overflow,
    
    // Transforms
    transform: s.transform,
    transition: s.transition,
  };
}, '.my-selector');
```

### Recursive Component Tree Extraction

```ts
const componentTree = await page.evaluate((rootSelector) => {
  function extractTree(el, depth = 0) {
    if (depth > 5) return null;
    const s = getComputedStyle(el);
    const children = [];
    for (const child of el.children) {
      if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue;
      const subtree = extractTree(child, depth + 1);
      if (subtree) children.push(subtree);
    }
    return {
      tag: el.tagName.toLowerCase(),
      class: el.className?.toString().trim() || '',
      text: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
        ? el.textContent?.trim().slice(0, 60) : undefined,
      styles: {
        display: s.display,
        position: s.position,
        width: s.width,
        padding: s.padding,
        margin: s.margin,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        color: s.color,
        backgroundColor: s.backgroundColor,
        borderRadius: s.borderRadius,
      },
      children: children.length > 0 ? children : undefined,
    };
  }
  const root = document.querySelector(rootSelector);
  return root ? extractTree(root) : null;
}, '.page-container');
```

## Converting Extracted Values to Tailwind Classes

### Computed Value → Tailwind Mapping Tables

#### Font Size

| Computed | Tailwind Class | rem |
|----------|---------------|-----|
| 12px | `text-xs` | 0.75rem |
| 14px | `text-sm` | 0.875rem |
| 16px | `text-base` | 1rem |
| 18px | `text-lg` | 1.125rem |
| 20px | `text-xl` | 1.25rem |
| 24px | `text-2xl` | 1.5rem |
| 30px | `text-3xl` | 1.875rem |
| 36px | `text-4xl` | 2.25rem |
| 48px | `text-5xl` | 3rem |
| 60px | `text-6xl` | 3.75rem |

#### Font Weight

| Computed | Tailwind Class |
|----------|---------------|
| 100 | `font-thin` |
| 200 | `font-extralight` |
| 300 | `font-light` |
| 400 | `font-normal` |
| 500 | `font-medium` |
| 600 | `font-semibold` |
| 700 | `font-bold` |
| 800 | `font-extrabold` |
| 900 | `font-black` |

#### Line Height

| Computed | Tailwind Class |
|----------|---------------|
| 1 | `leading-none` |
| 1.25 | `leading-tight` |
| 1.375 | `leading-snug` |
| 1.5 | `leading-normal` |
| 1.625 | `leading-relaxed` |
| 2 | `leading-loose` |

#### Spacing (padding, margin, gap)

| Computed | Tailwind Unit | Class Example |
|----------|--------------|---------------|
| 0px | `0` | `p-0` |
| 1px | `px` | `p-px` |
| 2px | `0.5` | `p-0.5` |
| 4px | `1` | `p-1` |
| 6px | `1.5` | `p-1.5` |
| 8px | `2` | `p-2` |
| 10px | `2.5` | `p-2.5` |
| 12px | `3` | `p-3` |
| 14px | `3.5` | `p-3.5` |
| 16px | `4` | `p-4` |
| 20px | `5` | `p-5` |
| 24px | `6` | `p-6` |
| 28px | `7` | `p-7` |
| 32px | `8` | `p-8` |
| 36px | `9` | `p-9` |
| 40px | `10` | `p-10` |
| 44px | `11` | `p-11` |
| 48px | `12` | `p-12` |
| 64px | `16` | `p-16` |
| 80px | `20` | `p-20` |
| 96px | `24` | `p-24` |

#### Border Radius

| Computed | Tailwind Class |
|----------|---------------|
| 0px | `rounded-none` |
| 2px | `rounded-sm` |
| 4px | `rounded` |
| 6px | `rounded-md` |
| 8px | `rounded-lg` |
| 12px | `rounded-xl` |
| 16px | `rounded-2xl` |
| 24px | `rounded-3xl` |
| 9999px | `rounded-full` |

#### Box Shadow

| Computed (approximate) | Tailwind Class |
|----------------------|---------------|
| `0 1px 2px 0 rgba(0,0,0,0.05)` | `shadow-sm` |
| `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)` | `shadow` |
| `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` | `shadow-md` |
| `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | `shadow-lg` |
| `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` | `shadow-xl` |
| `0 25px 50px -12px rgba(0,0,0,0.25)` | `shadow-2xl` |

#### Common Colors (Tailwind Default Palette)

| Hex | Tailwind Class |
|-----|---------------|
| `#f8fafc` | `slate-50` |
| `#f1f5f9` | `slate-100` |
| `#e2e8f0` | `slate-200` |
| `#cbd5e1` | `slate-300` |
| `#94a3b8` | `slate-400` |
| `#64748b` | `slate-500` |
| `#475569` | `slate-600` |
| `#334155` | `slate-700` |
| `#1e293b` | `slate-800` |
| `#0f172a` | `slate-900` |
| `#3b82f6` | `blue-500` |
| `#2563eb` | `blue-600` |
| `#1d4ed8` | `blue-700` |
| `#6366f1` | `indigo-500` |
| `#4f46e5` | `indigo-600` |
| `#10b981` | `emerald-500` |
| `#ef4444` | `red-500` |
| `#f59e0b` | `amber-500` |

### Extending tailwind.config.js for Non-Standard Values

When extracted values don't match any Tailwind default:

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#extracted-light',
          500: '#extracted-primary',
          600: '#extracted-hover',
          900: '#extracted-dark',
        },
      },
      fontSize: {
        'hero': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(0,0,0,0.12)',
      },
    },
  },
};
```

### Helper Functions

#### RGB to Hex

```ts
function rgbToHex(rgb: string): string {
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return rgb;
  const [r, g, b] = match.map(Number);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
```

#### Find Nearest Tailwind Color

```ts
const TAILWIND_COLORS: Record<string, string> = {
  '#f8fafc': 'slate-50', '#f1f5f9': 'slate-100', '#e2e8f0': 'slate-200',
  '#cbd5e1': 'slate-300', '#94a3b8': 'slate-400', '#64748b': 'slate-500',
  '#475569': 'slate-600', '#334155': 'slate-700', '#1e293b': 'slate-800',
  '#0f172a': 'slate-900', '#3b82f6': 'blue-500', '#2563eb': 'blue-600',
  '#6366f1': 'indigo-500', '#4f46e5': 'indigo-600',
  // ... extend as needed
};

function findNearestTailwindColor(hex: string): string | null {
  return TAILWIND_COLORS[hex.toLowerCase()] ?? null;
}
```

## Mapping Extractions to styling.instructions.md

After extraction, format results into the project's token tables with both raw values and Tailwind classes:

### Color Palette Table

```markdown
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| --color-primary | #3b82f6 | `blue-500` | CTA buttons, active links |
| --color-text | #1e293b | `slate-800` | Body text |
| --color-text-muted | #64748b | `slate-500` | Secondary text, captions |
| --color-bg | #ffffff | `white` | Page background |
| --color-surface | #f8fafc | `slate-50` | Card/container backgrounds |
| --color-border | #e2e8f0 | `slate-200` | Borders, dividers |
```

### Typography Table

```markdown
| Role | Font | Size | Tailwind | Weight | Line Height |
|------|------|------|----------|--------|-------------|
| Heading 1 | Inter | 48px | `text-5xl` | `font-bold` | `leading-tight` |
| Heading 2 | Inter | 30px | `text-3xl` | `font-semibold` | `leading-snug` |
| Body | Inter | 16px | `text-base` | `font-normal` | `leading-relaxed` |
| Small | Inter | 14px | `text-sm` | `font-normal` | `leading-normal` |
| Button | Inter | 14px | `text-sm` | `font-medium` | `leading-none` |
```
