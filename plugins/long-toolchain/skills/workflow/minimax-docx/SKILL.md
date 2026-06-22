---
name: minimax-docx
description: "**WORKFLOW SKILL** - Create, edit, and template-format Word documents with OpenXML-first rigor and validation gates. Use when: write report docx, generate proposal document, fill Word template, edit existing .docx, apply document style template, contract or formal document formatting."
argument-hint: "Provide task route (create/edit/format), input/output .docx paths, style requirements, and whether strict template parity is required."
portability: adapt-port
source-skill: MiniMax-AI/skills/skills/minimax-docx
overlap-gate:
  existing-skill: workflow/content-research-workflow
  overlap-score: 49
  decision: create-new
---

# MiniMax DOCX

Portability tag: adapt-port.

Use this skill for formal Word document production where structure correctness and formatting integrity are mandatory.

## Route Selection

1. CREATE route: no input document, produce a new .docx.
2. EDIT route: existing .docx with content updates/fill operations.
3. FORMAT route: apply a template/style system to existing content.

When route intent is ambiguous, ask one route-disambiguation question before execution.

## Procedure

### Step 1: Environment and Preflight

1. Verify document toolchain and dependencies before edits.
2. Preview/analyze input files before mutation when source docs exist.
3. Define expected output schema (sections, styles, numbering, headers/footers).

### Step 2: Execute Chosen Route

1. CREATE: build structure first, then content, then style layers.
2. EDIT: apply minimal-content deltas and preserve unaffected structure.
3. FORMAT: transfer template style system without content duplication.

### Step 3: Validation Pipeline

1. Normalize runs to reduce style-fragment artifacts.
2. Validate XML structure and business rules.
3. If template compliance is required, run gate-check and block delivery on failure.

### Step 4: Output Verification

1. Diff before/after for edit/format tasks.
2. Confirm page/section headers, numbering, and table integrity.
3. Deliver only when validation and preview checks pass.

## Safety Defaults and Fallback Behavior

- Never bypass structural validation after write operations.
- If strict XSD validation fails, attempt deterministic repair before fallback.
- If route is uncertain, do not guess; force explicit route selection.
- If template merge risks content loss, preserve source content and return a blocked status with remediation steps.

## Output Checklist

- Correct route applied with auditable preflight
- Validation and gate-check results captured
- Structural integrity and formatting parity verified
- Final .docx output path reported
