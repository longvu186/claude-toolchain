---
name: framer-static-mirror-reliability
description: "WORKFLOW SKILL - Maintain Framer static mirrors without design drift. Use for Framer mirror content updates, runtime DOM patching, hydration copy fixes, injected nav/link behavior, module MIME validation, and production parity QA. Trigger phrases: Framer mirror, static Framer site, mirrored Framer content, Framer hydration, Framer nav hover, Framer runtime patch."
argument-hint: "Describe the Framer route, native component pattern, runtime patch, and validation target."
---

# Framer Static Mirror Reliability

Playbook for updating mirrored Framer sites while preserving the native layout, interaction, and hydration behavior.

## When to Use

- Updating content in a static mirror of a Framer site.
- Injecting or cloning navigation, locale, CTA, or route links after hydration.
- Fixing hydration copy drift, lazy module gaps, or runtime DOM patches.
- Validating local or deployed Framer mirrors in a browser.

## Core Rules

1. Identify the native Framer pattern before writing the patch.
2. Mutate native nodes in place when a matching pattern exists: text, links, images, attributes, rows, cards, slots, or cloned siblings.
3. Do not replace native sections with generated cards, grids, tables, or route blocks unless no native pattern exists and the exception is documented.
4. Keep runtime patching deterministic and idempotent; source runtime should sync into the mirrored runtime through the patch pipeline.
5. Validate rendered browser state after hydration, not only raw HTML strings.

## Reliable Patterns

### Native pattern mutation

- Treat briefs, PDFs, and design notes as placement instructions first, not permission to invent new visual structures.
- Clone the closest native sibling only when an additional item is needed; preserve Framer classes, wrappers, and responsive slot geometry.
- Prefer targeted text/attribute/image replacement over `outerHTML` replacement for runtime-owned sections.
- Keep route/footer boundaries explicit so custom content never lands below a native footer-like area.

### Route-to-route native section cloning

- Build-time patchers must remove stale clone markers or owned clone sections before inserting the current native section clone.
- Assert exactly one owned clone and one build marker in generated output, then assert route-owned content appears before the clone and FAQ/footer-like boundaries appear after it.
- Runtime clone fallback code is recovery-only: dedupe existing build-time/runtime clones before placement and before any fetch/clone retry.
- Framer SSR responsive variants inside cloned title/card nodes can duplicate visible and accessibility text. Prune or `aria-hidden` non-owned direct `.ssr-variant` wrappers when a single runtime-owned clone is intended.
- Verify desktop/mobile visible text plus visible/hidden responsive-variant counts, not only marker counts.

### Injected nav interactions

- Link visibility and `href` correctness are not enough for cloned Framer nav items.
- Validate mouse and keyboard interaction classes on injected links after mount.
- If Framer's native listeners miss cloned anchors, use a narrow fallback that toggles the same native `hover` class only on the injected nodes for `mouseover`/`focus` and removes it on `mouseleave`/`focusout`.
- Avoid broad nav restyling that could drift from upstream Framer behavior.

### Local module serving

- Browser validation must serve `.mjs` with a JavaScript MIME type.
- Python `http.server` can serve `.mjs` as `text/plain` in some environments; use `serve-handler`, Vite preview, or another static server with correct module MIME handling.
- Treat MIME errors and dynamic-import failures as environment or packaging defects until proven otherwise.

### QA probe scripting

- For complex Playwright probes, prefer a temporary `.mjs` script with cleanup over large inline `node -e` snippets, especially from PowerShell.
- Keep probe output structured as JSON so pass/fail evidence can be reused in run logs.
- Use browser tooling directly when interaction sequencing is the main risk and the script would mostly fight shell quoting.

## Verification Checklist

- Desktop and mobile browser screenshots for touched routes.
- Hydrated rendered-text markers after short and delayed checkpoints.
- Image fetch/decode or natural-dimension checks when media changes.
- Exactly one route-owned clone/build marker and correct route-content -> clone -> FAQ/footer order when native sections are cloned across routes.
- Clone-owned responsive variants do not duplicate visible or accessibility text on desktop or mobile.
- Link destination plus hover/focus class checks for injected nav items.
- No generated replacement blocks where a native route pattern was expected.
- No route-owned content below footer-like boundaries.
- No fatal console errors, failed dynamic imports, or module MIME errors.

## Output Contract

When invoked, provide:

1. Native pattern identified for each touched route.
2. Mutation strategy and documented exceptions.
3. Local serving strategy for browser validation.
4. Hydration-aware QA evidence and any remaining parity risk.