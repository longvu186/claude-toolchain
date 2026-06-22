---
name: content-research-workflow
description: "**WORKFLOW SKILL** - Collaboratively research, outline, draft, and refine long-form content with citations and iterative section feedback. Use when: content research workflow, research and write article, improve blog hook, section-by-section writing feedback, citation-assisted writing, thought leadership draft."
argument-hint: "Provide topic, audience, target format, desired tone, and citation style."
portability: direct-port
source-skill: ComposioHQ/awesome-claude-skills/content-research-writer
overlap-gate:
  existing-skill: workflow/documentation-manager
  overlap-score: 34
  decision: create-new
---

# Content Research Workflow

Portability tag: direct-port.

Use this skill as a structured writing partner for research-backed content that must keep the author's voice.

## When to Use

- Blog posts, newsletters, thought leadership, explainers
- Research-backed drafts requiring citations
- Hook and outline improvements before drafting
- Section-by-section editorial iteration

## Procedure

### Phase 1: Scope and Voice

1. Confirm topic, audience, goal, and length.
2. Capture voice preferences (formal, conversational, technical, hybrid).
3. Define citation style (inline, numbered, footnote).

### Phase 2: Collaborative Outline

1. Build outline with hook, intro, sections, conclusion.
2. Maintain a research TODO list per section.
3. Validate narrative flow before drafting begins.

### Phase 3: Research and Evidence

1. Gather credible sources relevant to each section.
2. Extract key findings, quotes, and data points.
3. Attach citations at insertion time, not at the end.

### Phase 4: Draft and Iterate

1. Improve hook with multiple alternatives.
2. Review one section at a time for clarity, flow, evidence, and tone.
3. Propose line edits with rationale, not opaque rewrites.

### Phase 5: Final Polish

1. Run full-draft review: structure, argument strength, readability, consistency.
2. Validate citation completeness.
3. Produce publication-ready checklist and final revision plan.

## Safety Defaults and Fallback Behavior

- Never fabricate citations, quotes, or statistics.
- If web/source access is unavailable, work from provided materials and mark unsupported claims as TODO.
- Label uncertain facts as unverified rather than presenting them as truth.
- Avoid exposing private/internal data in drafts unless explicitly approved.
- If tone guidance is unclear, provide two style variants and request preference.

## Output Checklist

- Outline with research gaps
- Source-backed research notes
- Iterative section feedback with concrete edits
- Final review with publish checklist
- Citation integrity confirmed or flagged
