---
description: "Bootstrap a new workspace with my standard AI, specs, architecture, UI, and styling documentation system plus session-completion workflow."
argument-hint: "Optionally describe the project type, stack, or any deviations from the standard template."
---

Bootstrap this workspace with my standard documentation system and workspace instructions.

Requirements:

- Create or update `.github/copilot-instructions.md`.
- Add the default documentation assets under `docs/ai/`, `docs/specs/`, `docs/architecture/`, and `docs/ui/`.
- Scaffold the knowledge-cache registries under `memories/repo/`: `commands.md` (run/dev, build,
  typecheck, lint, test, deploy, db/migrate, codegen) and `design-system.md` (tokens, component
  variants, repeated-surface conventions). Create them with a `<!-- last-verified: <today> -->` header
  even if empty, so the write-back target always exists. Add the critical 4–5 commands to an `AGENTS.md`
  "Commands" block. See the `knowledge-cache` skill for the format and read-first/write-back contract.
- Include `.github/instructions/styling.instructions.md`.
- Preserve any existing useful content and merge instead of overwriting blindly.
- Register the custom agents when relevant: Quality Manager, Documentation Manager, UI Analyst.
- Add session completion workflow rules:
  - update docs when relevant
  - create a per-session run log
  - run tests when relevant
  - state which docs were updated and which tests were run in the final response
- Add the `docs/specs/` bundle with `active/`, `archive/`, `decisions/`, and `templates/`.
- Use the Symphony spec bundle as the active slice standard: `docs/specs/active/<slice>/brief.md`, `spec.md`, and `validation.md`.
- Make `docs/specs/templates/spec-template.md` the default detailed spec starter.
- Do not create a requirements dashboard or traceability matrix by default; GitNexus handles code traceability better.
- Keep the full spec template in place even when details are missing.
- Mark missing spec details as `TBD - <what to fill in>` instead of deleting sections or writing `N/A`.
- Include an explicit `Completion: <n>%` field in `brief.md`, `spec.md`, and `validation.md`.
- If the repository already contains a retired active-spec layout such as `docs/requirements/`, a dashboard, a traceability matrix, or single-file `REQ-*.md` slices, migrate that content into `docs/specs/` and retire the obsolete active files instead of keeping both structures.

If the repository already contains documentation, merge with the existing structure and avoid duplication.
If test commands are not configured, state that explicitly instead of assuming them.
