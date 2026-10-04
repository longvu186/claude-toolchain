---
name: lead-research-assistant
description: "**WORKFLOW SKILL** - Identify and prioritize high-fit sales or partnership leads from a product profile and ICP, with outreach-ready context and scoring. Use when: find target leads, build prospect list, qualify companies, account research, outreach planning, lead prioritization."
argument-hint: "Provide product value proposition, ideal customer profile (industry/size/location), and lead count target."
portability: adapt-port
source-skill: ComposioHQ/awesome-claude-skills/lead-research-assistant
overlap-gate:
  existing-skill: workflow/content-research-workflow
  overlap-score: 64
  decision: create-new
---

# Lead Research Assistant

Portability tag: adapt-port.

Use this skill to convert broad market targeting into a ranked lead list with actionable outreach context.

## When to Use

- Building outbound lead lists for sales or partnerships
- Prioritizing accounts by fit and urgency
- Preparing personalized outreach context quickly
- Turning product/ICP notes into concrete prospect targets

## Procedure

### Phase 1: Product and ICP Intake

1. Capture product problem, value proposition, and differentiators.
2. Define ICP dimensions: industry, company size, geography, maturity stage.
3. Define disqualifiers to avoid low-fit leads.

### Phase 2: Candidate Discovery

1. Generate an initial company pool from the ICP criteria.
2. Collect fit signals: use case match, growth signals, tooling, org structure.
3. Capture decision-maker roles relevant to the purchase motion.

### Phase 3: Scoring and Prioritization

1. Score leads (1-10) using transparent fit criteria.
2. Separate high-confidence leads from exploratory leads.
3. Provide short rationale per score.

### Phase 4: Outreach Readiness

1. Draft tailored value hook for each top lead.
2. Suggest contact strategy (email, LinkedIn, referral, partner path).
3. Provide conversation starters tied to each lead's likely pain points.

### Phase 5: Delivery

1. Provide lead table with score, rationale, role target, and next action.
2. Include assumptions and data-confidence notes.
3. Flag leads needing deeper validation.

## Safety Defaults and Fallback Behavior

- Do not fabricate company facts, contacts, or funding details.
- If evidence for a lead is weak, mark confidence as low.
- Avoid collecting or exposing private personal data.
- If web research is limited, deliver a clearly labeled hypothesis list.

## Output Checklist

- ICP and disqualifiers documented
- Ranked lead list delivered
- Score rationale present for each priority lead
- Outreach strategy and starters included
- Confidence and data gaps clearly marked
