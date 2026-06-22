---
description: "Quick structured code/plan review. Follows the Code Reviewer protocol as a one-shot prompt — no mode switch required. Provide files or describe the scope to review."
---

Review the provided code or plan using a structured multi-perspective protocol.

## Instructions

1. **Predict** 3–5 likely issues before reading the code (based on tech and scope).
2. **Read** all relevant files thoroughly — trace data flow end-to-end.
3. **Analyze** from multiple perspectives:
   - For code: Security Auditor, New-Hire Reader, Ops/SRE, Performance Engineer
   - For plans: Executor, Stakeholder, Skeptic, Maintainer
4. **Find gaps** — what's MISSING, not just what's wrong (error handling, validation, tests, docs, edge cases).
5. **Self-audit** — downgrade low-confidence findings to Open Questions.
6. **Realist check** — pressure-test severity of CRITICAL/MAJOR findings.

## Output

Use this structure:

```markdown
## Review: {subject}

**Scope**: {files reviewed}
**Verdict**: REJECT | REVISE | ACCEPT-WITH-RESERVATIONS | ACCEPT

### Summary
{1-3 sentences}

### Findings
#### CRITICAL — {title} — {file:line} — {description + evidence + suggested fix}
#### MAJOR — {title} — {file:line} — {description}
#### MINOR — {description}
#### NIT — {description}

### Gap Analysis
### Open Questions
### What's Done Well
```

Severity: CRITICAL = security/data-loss/crash (needs file:line proof), MAJOR = incorrect behavior/missing validation, MINOR = style/naming, NIT = suggestions.

Verdict: REJECT (1+ CRITICAL or 3+ compounding MAJOR), REVISE (1-2 MAJOR), ACCEPT-WITH-RESERVATIONS (minor issues), ACCEPT (clean).
