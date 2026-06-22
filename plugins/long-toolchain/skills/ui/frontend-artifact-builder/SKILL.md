---
name: frontend-artifact-builder
description: "**WORKFLOW SKILL** - Build and package modern frontend artifacts (React, Tailwind, shadcn/ui) into shareable deliverables. Use when: frontend artifact builder, build artifact ui, bundle single html artifact, react tailwind artifact, shadcn artifact workflow, portable demo artifact."
argument-hint: "Provide target UX, delivery format (single HTML or app bundle), and constraints (framework, timeline, assets)."
portability: adapt-port
source-skill: ComposioHQ/awesome-claude-skills/artifacts-builder
overlap-gate:
  existing-skill: ui/ui-builder
  overlap-score: 58
  decision: create-new
---

# Frontend Artifact Builder

Portability tag: adapt-port.

Use this skill when the objective is not only UI implementation, but also packaging the result as an artifact that can be shared or replayed quickly.

## When to Use

- Building interactive prototypes that must run immediately
- Producing single-file HTML artifacts from React/Tailwind projects
- Creating demo deliverables for reviews or async approvals
- Shipping polished UI slices with clear handoff outputs

## Procedure

### Phase 1: Intake and Build Mode

1. Confirm artifact target: single HTML, static bundle, or source project.
2. Confirm interaction complexity (stateful, multi-view, forms, charts).
3. Reuse project tokens/design instructions before inventing new styles.
4. Identify recurring surfaces that should become shared wrappers, variants, or layout shells before implementation starts.

### Phase 2: Scaffold

1. Prefer existing workspace scaffolds/scripts when available.
2. For React stack: TypeScript + Vite + Tailwind + component library.
3. Set aliases and baseline design tokens early.
4. Establish the shared shell, shared page-header pattern, and reusable section/card wrappers before page-specific assembly.

### Phase 3: Build

1. Implement structure first, then style parity.
2. Keep visual direction intentional; avoid generic AI-looking defaults.
3. Include responsive behavior and meaningful interaction states.
4. Keep dependencies minimal and documented.
5. Prefer updating shared tokens, variants, and wrappers over repeating page-local class stacks on recurring surfaces.

### Phase 4: Package

1. Build production assets.
2. Bundle to requested output format (single HTML when required).
3. Verify artifact opens without dev server when portability is expected.

### Phase 5: Delivery

1. Provide artifact path and run command.
2. Include known limitations (browser support, external APIs, fonts).
3. Provide quick edit points for follow-up iterations.

## Safety Defaults and Fallback Behavior

- Review project scripts before executing; do not run unknown scripts blindly.
- If package manager tooling is missing, fall back to a no-build static artifact path.
- If single-file bundling fails, deliver static dist output plus a clear launch command.
- Avoid embedding secrets, private keys, or signed URLs inside artifacts.
- Prefer local or permissive assets; if external assets fail, replace with deterministic placeholders.
- Do not package a polished artifact that still achieves consistency through page-by-page restyling of shared surfaces.

## Output Checklist

- Build mode selected and justified
- Artifact produced in requested format
- Responsive and interaction states verified
- Safety checks applied (no secrets, no unsafe scripts)
- Delivery notes included for replay/edit
