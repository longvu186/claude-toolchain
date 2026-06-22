# Design Analysis Methodology

## Systematic Visual Decomposition

When analyzing a screenshot, work in layers:

### Layer 1: Layout Grid
- Is the page centered or full-width?
- How many columns? (1, 2, 3, 12-column grid?)
- What's the max-width of the content area?
- Is there a sidebar? What's its width ratio?
- **Tailwind mapping**: `mx-auto max-w-7xl`, `grid grid-cols-3`, `flex`, etc.

### Layer 2: Vertical Rhythm
- What's the spacing pattern between sections? (constant? doubling?)
- Is there a base unit? (commonly 4px, 8px, or 16px)
- Are section paddings symmetric or asymmetric?
- **Tailwind mapping**: `space-y-8`, `py-12`, `gap-6`, etc.

### Layer 3: Component Boundaries
Draw mental boxes around each distinct component:
- Navigation bar (height, background, position: sticky?)
- Hero section (background, overlay, text alignment)
- Card grids (card dimensions, gap, border, shadow)
- Footer (columns, background, link styles)

### Layer 4: Typography Hierarchy
Count distinct text styles (usually 5-8 in a well-designed page):

| Role | Typical Size | Tailwind Class | Weight |
|------|-------------|----------------|--------|
| H1 (hero title) | 36-60px | `text-4xl` to `text-6xl` | `font-bold` or `font-extrabold` |
| H2 (section heading) | 24-36px | `text-2xl` to `text-4xl` | `font-bold` or `font-semibold` |
| H3 (card title) | 18-24px | `text-lg` to `text-2xl` | `font-semibold` |
| Body | 16px | `text-base` | `font-normal` |
| Small | 12-14px | `text-xs` to `text-sm` | `font-normal` |
| Button | 14-16px | `text-sm` to `text-base` | `font-medium` |

### Layer 5: Color Inventory
Most designs use 3-7 distinct colors:

| Role | Common Tailwind Palette |
|------|------------------------|
| Primary (CTAs, active) | `blue-600`, `indigo-600`, `violet-600` |
| Secondary (accent) | `emerald-500`, `amber-500` |
| Neutral-900 (main text) | `slate-900`, `gray-900`, `zinc-900` |
| Neutral-500 (secondary text) | `slate-500`, `gray-500` |
| Neutral-200 (borders) | `slate-200`, `gray-200` |
| Background | `white`, `slate-50`, `gray-50` |
| Surface (cards) | `white`, `slate-50` |

## Estimation Techniques

### Font Size Estimation
- Compare text height to known browser defaults (16px body)
- H1 is typically 2-3x body size (32-48px) → `text-3xl` to `text-5xl`
- H2 is typically 1.5-2x body size (24-32px) → `text-2xl` to `text-3xl`
- Small text is typically 0.75-0.875x body (12-14px) → `text-xs` to `text-sm`

### Spacing Estimation
- Use the text height as a reference ruler
- If body text appears ~16px tall, estimate gaps relative to that

| Estimated px | Tailwind Class |
|-------------|----------------|
| 4px | `p-1`, `gap-1` |
| 8px | `p-2`, `gap-2` |
| 12px | `p-3`, `gap-3` |
| 16px | `p-4`, `gap-4` |
| 20px | `p-5`, `gap-5` |
| 24px | `p-6`, `gap-6` |
| 32px | `p-8`, `gap-8` |
| 48px | `p-12`, `gap-12` |
| 64px | `p-16`, `gap-16` |
| 96px | `p-24`, `gap-24` |

### Color Extraction from Screenshots
- Use the color picker in your image viewer/editor
- Dark text is rarely pure `#000000` — it's usually `slate-800` (#1e293b) or `gray-800` (#1f2937)
- White backgrounds may be `white`, `slate-50` (#f8fafc), or `gray-50` (#f9fafb)
- Primary colors tend to appear on buttons, links, and accents

## Common Tailwind Design Patterns

| Pattern | Visual Cue | Tailwind Implementation |
|---------|-----------|------------------------|
| Centered container | Content doesn't touch edges | `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` |
| Sticky nav | Nav stays at top while scrolling | `sticky top-0 z-50 bg-white/80 backdrop-blur-md` |
| Card grid | Repeated rectangular items | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` |
| Hero overlay | Text on top of image | `relative bg-cover bg-center` + child `absolute inset-0 bg-black/50` |
| Pill buttons | Fully rounded button corners | `rounded-full px-6 py-2` |
| Glass effect | Semi-transparent blurred bg | `backdrop-blur-lg bg-white/10 border border-white/20` |
| Gradient text | Text with color gradient | `bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent` |
| Sidebar layout | Fixed sidebar + scrolling content | `flex` → `w-64 shrink-0` + `flex-1 min-w-0` |
| Responsive stack | Side-by-side on desktop, stacked mobile | `flex flex-col md:flex-row gap-6` |
| Badge/chip | Small label with bg | `inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800` |
| Avatar | Circular image | `h-10 w-10 rounded-full object-cover` |
| Divider | Horizontal line between items | `divide-y divide-slate-200` or `border-t border-slate-200` |
