---
description: "Refresh an existing workspace's documentation scaffold to the latest template version. Adds missing files without overwriting project-specific content."
---

# Refresh Workspace Docs

You are refreshing an existing VS Code workspace's documentation scaffold files.

## Rules

1. **Never overwrite** a file that contains project-specific content (anything beyond TBD placeholders).
2. **Audit the existing docs structure before adding files**. If the repository still uses a retired active-spec layout such as `docs/requirements/`, a requirements dashboard, a traceability matrix, or single-file `REQ-*.md` slices, migrate that content into `docs/specs/` first. Keep the migrated active bundle anchored to the product, feature, or domain slice already described by the legacy docs; do not make the migration task itself the active brief/spec/validation subject.
3. **Update** the `copilot-instructions.md` Documentation Assets list and Custom Agents table if the template has new entries, but **preserve** all project-specific sections (Project Overview, Build and Test, Architecture, Conventions).
4. **Bump** `<!-- last-verified: ... -->` dates to today in every file you touch.
5. **Use the Symphony spec bundle** for every active slice: `docs/specs/active/<slice>/brief.md`, `spec.md`, and `validation.md` kept as full templates with `Completion: <n>%`, directed `TBD - <what to fill in>` markers, journey taxonomy, contract touchpoints, rollout, and validation evidence. Migration rationale and structure-change evidence belong in run logs, archive notes, or decision notes, not as the main problem statement or validation scope of the active slice.
6. **Retire the old active structure after migration**. Update references so `docs/specs/` is the only active spec location, then remove or archive obsolete dashboards, matrices, and one-file requirement slices once their content is preserved.
7. Report a summary at the end: files added, files migrated, files removed or archived, files skipped (with reason), files updated.

## Current Scaffold Template

These files should exist in every project. Check each one:

### `.github/`
- `.github/copilot-instructions.md` — workspace instructions with Documentation Assets, Custom Agents table, Session Completion Workflow
- `.github/instructions/styling.instructions.md` — styling tokens (applyTo CSS/TSX/etc.)

### `docs/ai/`
- `docs/ai/context.md` — AI-facing project context
- `docs/ai/code-index.json` — machine-readable file & symbol index
- `docs/ai/symbol-map.md` — fast symbol lookup table
- `docs/ai/experience-log.md` — session discoveries and pitfalls
- `docs/ai/run-logs/README.md` — run-log naming convention and required sections

### `docs/specs/`
- `docs/specs/README.md` — spec system overview and folder rules
- `docs/specs/active/README.md` — active slice folder convention
- `docs/specs/archive/README.md` — archive guidance for completed or dropped slices
- `docs/specs/decisions/README.md` — decision log guidance
- `docs/specs/templates/brief-template.md` — scoping brief template
- `docs/specs/templates/spec-template.md` — detailed slice spec template
- `docs/specs/templates/validation-template.md` — validation note template
- `docs/specs/templates/decision-template.md` — decision note template

### `docs/architecture/`
- `docs/architecture/codebase-guide.md` — architecture overview
- `docs/architecture/env-vars.md` — environment variable reference
- `docs/architecture/edge-functions.md` — edge/serverless function catalog
- `docs/architecture/modules.md` — module ownership guide

### `docs/ui/`
- `docs/ui/spec.md` — master UI specification
- `docs/ui/component-inventory.md` — component catalog
- `docs/ui/design-tokens.md` — extracted design tokens
- `docs/ui/breakpoints.md` — responsive breakpoints
- `docs/ui/pages/home.md` — home page UI map (add more page files as needed)

## Approach

1. Read `copilot-instructions.md` to understand the project's current state.
2. Check each file in the scaffold template list above.
3. If retired active-spec docs exist, migrate them into `docs/specs/active/<slice>/brief.md`, `spec.md`, and `validation.md` before adding anything else. Keep all useful content and anchor the active bundle to the underlying project plan instead of the migration task itself, then remove or archive the obsolete active files once references are updated.
4. For each remaining missing file, create it with the full template content. For spec docs, keep all sections, use `TBD - <what to fill in>` placeholders, and include `Completion: <n>%`.
5. For `copilot-instructions.md`, compare the Documentation Assets list and Custom Agents table against the template — add any missing entries while keeping project content intact, and remove or rewrite references to retired `docs/requirements/`-style structures.
6. Print a summary table: `| File | Action | Reason |`.
