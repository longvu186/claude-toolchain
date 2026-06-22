---
name: brand-guidelines
description: "**WORKFLOW SKILL** - Apply brand tokens (color, typography, spacing, tone) to UI artifacts and docs while preserving accessibility. Use when: apply brand guidelines, brand styling, visual identity pass, enforce color tokens, typography alignment, brand consistency review."
argument-hint: "Provide target brand palette/fonts, artifact type (UI/docs/slides), and strictness level for compliance."
portability: direct-port
source-skill: ComposioHQ/awesome-claude-skills/brand-guidelines
overlap-gate:
  existing-skill: ui/design-intelligence
  overlap-score: 61
  decision: create-new
---

# Brand Guidelines

Portability tag: direct-port.

Use this skill to convert ad-hoc visuals into consistent brand output without sacrificing readability or accessibility.

## When to Use

- Applying brand identity to existing UI screens
- Updating docs or decks to match visual standards
- Running brand consistency checks before delivery
- Mapping one-off colors/fonts into reusable design tokens

## Procedure

### Phase 1: Gather Brand Inputs

1. Collect official palette, type scale, spacing, iconography, and tone rules.
2. Mark required rules vs flexible recommendations.
3. Capture contrast constraints and accessibility requirements.

### Phase 2: Token Mapping

1. Convert raw styles to token names (for example `--brand-primary`, `--brand-text`).
2. Map headings/body/labels to a typography scale.
3. Define semantic color usage (success, warning, danger, neutral).
4. Mark repeated surfaces such as headers, footers, cards, toolbars, buttons, and section shells that should be driven by shared variants or wrappers instead of page-local overrides.

### Phase 3: Application

1. Apply tokens across components and states (default, hover, active, disabled).
2. Remove hardcoded hex values and ad-hoc font overrides.
3. Keep layout spacing consistent with tokenized spacing units.
4. Push recurring spacing, typography, color, border, radius, shadow, and interaction rules into shared components or layout shells before touching individual pages.

### Phase 4: Verification

1. Validate contrast for critical text/background pairs.
2. Check component parity across desktop and mobile breakpoints.
3. Produce a short compliance report: pass, exception, rationale.

## Safety Defaults and Fallback Behavior

- Do not invent brand values when official references are missing.
- If brand specs are incomplete, apply only verified rules and mark gaps as TODO.
- Keep accessibility minimums even when strict brand color choices conflict.
- If custom fonts are unavailable, use explicit fallback stacks and note visual delta.
- Do not use a brand pass as a reason to restyle recurring headers, cards, or section shells page by page; update the shared token or wrapper layer instead.

## Output Checklist

- Brand token map created
- UI/doc artifact updated with tokenized styles
- Accessibility and contrast checks recorded
- Exceptions documented with rationale
