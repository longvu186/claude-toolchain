---
name: changelog-generator
description: "**WORKFLOW SKILL** - Generate user-facing changelogs from git history by categorizing commits and rewriting technical changes into clear release notes. Use when: generate changelog, write release notes, weekly product updates, version release summary, customer-friendly change log."
argument-hint: "Provide release range (tags/dates/commits), audience type, and output format (markdown/email/app-store)."
portability: adapt-port
source-skill: ComposioHQ/awesome-claude-skills/changelog-generator
overlap-gate:
  existing-skill: workflow/documentation-manager
  overlap-score: 67
  decision: create-new
---

# Changelog Generator

Portability tag: adapt-port.

Use this skill to produce publish-ready, non-technical release notes from raw commit history.

## When to Use

- Shipping a version release with external notes
- Publishing weekly or monthly product updates
- Preparing app-store or stakeholder updates
- Turning noisy commit streams into customer language

## Procedure

### Phase 1: Scope Collection

1. Define the commit range (tag-to-tag, date range, or SHA range).
2. Define audience (end users, customers, internal, mixed).
3. Choose tone and output shape (brief, detailed, bullet-first).

### Phase 2: Commit Intake

1. Collect commits and PR metadata in scope.
2. Remove non-user-facing noise (merge-only, formatting-only, tooling-only) unless relevant.
3. Group related commits into single product changes.

### Phase 3: Categorization

1. Categorize into: new features, improvements, fixes, security, breaking changes.
2. Flag uncertain entries for human confirmation.
3. Prioritize user impact over technical depth.

### Phase 4: Rewrite

1. Rewrite technical commits into user-understandable outcomes.
2. Keep entries concrete and action-oriented.
3. Add migration/upgrade notes for breaking changes.

### Phase 5: Finalization

1. Run consistency pass (voice, tense, category quality).
2. Add summary metrics if useful (total fixes, notable features).
3. Output final changelog in requested format.

## Safety Defaults and Fallback Behavior

- Never fabricate changes not present in commit/PR evidence.
- If commit messages are ambiguous, mark entries as tentative for review.
- Exclude confidential or security-sensitive internal details from public notes.
- If git history is unavailable, generate a template and request explicit input data.

## Output Checklist

- Release range documented
- Changes grouped and categorized
- User-facing wording applied
- Breaking/security notes handled carefully
- Final changelog delivered in target format
