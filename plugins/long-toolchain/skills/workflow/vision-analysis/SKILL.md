---
name: vision-analysis
description: "**WORKFLOW SKILL** - Analyze images for description, OCR, UI critique, chart extraction, and object/activity detection using vision tooling. Use when: analyze image, OCR screenshot, review UI mockup, interpret chart image, extract data from photo, understand visual input."
argument-hint: "Provide image path/URL and desired mode: describe, ocr, ui-review, chart-data, or object-detect."
portability: adapt-port
source-skill: MiniMax-AI/skills/skills/vision-analysis
overlap-gate:
  existing-skill: ui/design-intelligence
  overlap-score: 66
  decision: create-new
---

# Vision Analysis

Portability tag: adapt-port.

Use this skill for structured visual interpretation tasks with mode-specific outputs.

## When to Use

- Describing image content in detail
- Extracting text from screenshots/documents
- Reviewing UI mockups and wireframes
- Reading chart/graph values and trends
- Listing objects, people, and activities in visuals

## Analysis Modes

- `describe`: broad visual understanding
- `ocr`: exact text extraction with structure
- `ui-review`: strengths/issues/suggestions for interface quality
- `chart-data`: labels, data points, and trend summary
- `object-detect`: entity list with approximate location/context

## Procedure

### Step 1: Input Validation

1. Confirm image source is accessible.
2. Confirm requested analysis mode and output format.
3. Confirm whether strict extraction or interpretive review is expected.

### Step 2: Mode-Specific Prompting

1. Use concise task framing aligned to selected mode.
2. Request deterministic output fields when extraction fidelity is required.
3. Separate observed facts from inferred interpretation.

### Step 3: Output Structuring

1. Return clear sections per mode.
2. Preserve original text structure for OCR outputs.
3. Include confidence notes when visual quality limits certainty.

## Safety Defaults and Fallback Behavior

- Do not claim certainty for unreadable or ambiguous regions.
- If dedicated vision MCP is unavailable, use available image inspection tools and label reduced fidelity.
- Never infer sensitive personal attributes beyond visible evidence.
- For UI critique, keep feedback actionable and non-speculative.

## Output Checklist

- Mode and scope confirmed
- Structured analysis output produced
- Confidence/uncertainty noted where required
- Fallback mode explicitly declared if used
