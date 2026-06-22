---
name: minimax-xlsx
description: "**WORKFLOW SKILL** - Create, edit, validate, and analyze Excel workbooks with formula-first integrity and XML-safe editing paths. Use when: create spreadsheet, edit existing .xlsx, repair broken formulas, build financial model workbook, validate Excel formulas, generate tabular report in Excel format."
argument-hint: "Provide route (read/create/edit/fix/validate), input/output workbook paths, and any formatting or formula constraints."
portability: adapt-port
source-skill: MiniMax-AI/skills/skills/minimax-xlsx
overlap-gate:
  existing-skill: data-mapping-patterns
  overlap-score: 61
  decision: create-new
---

# MiniMax XLSX

Portability tag: adapt-port.

Use this skill for spreadsheet operations where formula correctness and format preservation are non-negotiable.

## Route Selection

1. READ route: inspect and analyze workbook data without mutation.
2. CREATE route: generate new workbook from template-backed structure.
3. EDIT route: mutate an existing workbook with no collateral style/data loss.
4. FIX route: repair formula defects in existing workbook flows.
5. VALIDATE route: run static and recalculation checks before delivery.

## Procedure

### Step 1: Determine Mutation Level

1. Confirm whether source workbook must remain structurally unchanged.
2. Route to XML-safe edit path for any existing workbook mutation.
3. Reserve create path for genuinely new workbook generation.

### Step 2: Execute Workbook Changes

1. Apply formula-first policy for derived values.
2. Preserve sheet names, relationships, and unaffected cell content.
3. Apply formatting by semantic role (input/formula/reference) consistently.

### Step 3: Validation and Recalc

1. Run formula validation and inspect failures before output.
2. Run recalculation checks when environment supports it.
3. Verify key sheets/cells in output against expected state.

### Step 4: Delivery

1. Provide output workbook path and summary of applied routes.
2. Include validation evidence and any residual warnings.
3. Flag blockers explicitly when workbook integrity cannot be guaranteed.

## Safety Defaults and Fallback Behavior

- Never use destructive round-trip workflows that strip workbook features.
- Never hardcode computed values where formulas are required.
- If workbook structure cannot be preserved, stop and report a blocked state.
- If validation fails repeatedly, return failure evidence and minimal safe next-step guidance.

## Output Checklist

- Correct route selected and executed
- Workbook integrity checks passed
- Formula validation evidence captured
- Final output workbook delivered with route summary
