---
description: "Extract design tokens from a live URL and set up token-driven styling for a project. Run this once per project to establish design foundations."
---

# Design Token Setup

Extract design tokens from a reference URL and install them in the current project.

## Steps

1. Ask for the reference URL (production site, staging, or competitor to clone from)
2. Run token extraction:
   ```bash
   npx dembrandt <url> --json-only --save-output --dtcg --pages 3
   ```
3. If Dembrandt fails, try with `--browser=firefox --slow`
4. Generate the Tailwind config extension and instructions file:
   ```bash
   node ~/.claude/scripts/extract-design-tokens.js <url> --output ./design-tokens-output
   ```
5. Copy `design-tokens.instructions.md` to `.github/instructions/` in the project
6. Merge `tailwind-extend.js` values into the project's `tailwind.config.js`
7. Verify the instructions file is picked up by checking a component file

## Expected Output

- `.github/instructions/design-tokens.instructions.md` — auto-loaded for all UI files
- Updated `tailwind.config.js` with custom colors/fonts/spacing from the reference
- Raw tokens saved for reference in `design-tokens-output/tokens.json`
