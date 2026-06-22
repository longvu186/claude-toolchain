# User Profile — Long (longvu186@gmail.com)

The synthesized, cross-project model of who I am and how I work. This is the **semantic/profile
layer**: it is _rewritten_ (not appended) by the `/consolidate-memory` skill, which rolls up the
episodic layers (run-logs, curation queue, correction signals, per-project memories) into durable
beliefs. Atoms feed this; this is never just a list of atoms.

- **Policy detail** (stack rules, UI conventions, tool policy) lives in `~/.claude/CLAUDE.md` — do not duplicate it here.
- **Confidence tiers:** `established` = observed ≥2 times across sessions/projects. `provisional` = seen once, treat as a hypothesis.
- The digest block below is injected at every session start. Keep it tight; push detail into the full sections.

<!-- digest:start -->

## Profile digest (injected each session)

- **Who:** Solo builder, Vietnamese (thinks/reasons in English). Builds production web apps **and** heavily engineers his own AI toolchain. Highly systematic; invests in automation and tooling, not just features.
- **Comms:** Terse, direct. Action over explanation — implement, don't describe. Challenges assumptions and asks "is X actually better than Y?" — expects evidence, not agreement.
- **Decision lens:** Architecture over wording. Automation over polling. Prompt-budget conscious (keep always-loaded context tiny). Verify before claiming done.
- **Hard rules:** i18n Vietnamese-first (never hardcode VN text). `typecheck`+build must pass before any deploy. UI validation is screenshot-backed, not code-only. Styled confirm modals, never native `window.confirm`. System-first UI (shared tokens/shells before page-local).
- **Stack:** Vue 3 `<script setup lang="ts">` + Pinia + Tailwind + Supabase. Also Cloudflare, Vercel, Bubble.io. No Supabase calls in components — via stores/composables.
- **Tooling:** Claude Code is the primary (and now only) AI coding tool. GitNexus for structure/impact. Crawl4AI for web reads. Context7 only for version-sensitive APIs.
<!-- digest:end -->

---

## Identity & context

- Solo developer/operator. Vietnamese; UI work is Vietnamese-first bilingual, but internal reasoning and
  notes are in English (explicit correction logged 2026-05-24: "always think in English").
- Two parallel tracks: (1) shipping real apps (e.g. `app-understanding-portal`, the _tobuso_ migration,
  the _mrtuktuk_ food app), and (2) building/optimizing a sophisticated personal AI toolchain (this
  workspace). The toolchain work is a first-class project, not a side activity.
- Works in long, iterative sessions, often late at night. Comfortable driving many short follow-up runs
  rather than one big spec.

## How I work / collaboration

- Wants action, not narration. Prefers I implement changes over describing them. Keep prose short.
- Iterates rapidly with terse follow-ups ("yes", "try again", "do one more pass"). Treats me as a
  high-context collaborator, not a tutor.
- Protective of context/token budget — values keeping always-loaded instructions small and pushing
  detail into on-demand skills/memories. _(established — recurring theme across toolchain sessions)_
- Expects verification before "done" claims; has repeatedly caught and corrected unverified or
  silently-broken automation (e.g. the hooks-never-ran incident).

## Decision tendencies

- **Challenges before adopting.** Routinely asks whether a proposed tool/pattern is actually better than
  the current one (agentmemory vs file memory, "do I need semgrep?", "is anything else worth installing?").
  Give a real comparison with a recommendation, not a menu.
- **Architecture over surface fixes.** Believes durable wins come from structure, not wording tweaks
  (his own takeaway from the prompt-budget pass). Frame fixes at the system level.
- **Automation over manual upkeep.** Prefers mechanisms that self-maintain (hooks, queues, gates) over
  processes that depend on him remembering to run them. Manual logs he set up tend to get abandoned.
- **Evidence-driven.** Wants screenshot-backed UI validation, build gates, and raw-evidence artifacts
  kept append-only.

## Domain & skill map

- **Strong:** Vue/Pinia/Tailwind frontend architecture; Supabase; design-system/token thinking;
  AI-toolchain engineering (hooks, skills, agents, MCP wiring); prompt/context economics.
- **Active focus areas:** Claude Code automation depth, memory/learning systems, UI consistency
  guardrails, common-feature research baselines.
- _(Leave gaps unstated unless evidence shows a recurring stumbling block — do not invent weaknesses.)_

## Proven preferences (see CLAUDE.md for full policy)

- i18n mandatory, Vietnamese-first; preserve diacritics; proofread high-salience labels. _(established)_
- Planning docs: simple `docs/specs/active/<slice>/{brief,spec,validation}.md` — not dashboards/matrices. _(established)_
- Destructive/privilege actions → reusable styled confirmation modal. _(established)_
- System-first UI: shared tokens/variants/layout shells before page-local styling. _(established)_
- Build gates (`typecheck` + build) before any deploy; close code sessions with scoped validation + run log. _(established)_
- API reverse-engineering: raw evidence artifacts append-only; add index files, never rewrite captures. _(established)_

## Open corrections to honor

_(Append new corrections here as `/consolidate-memory` promotes them from the signal queue. Retire once
internalized into CLAUDE.md or a skill.)_

- Reason/think in English internally even when the product/content is Vietnamese. _(established — 2026-05-24)_

## Anti-patterns to avoid with me

- Don't pad responses with explanation he didn't ask for.
- Don't present a flat menu when he asked "which is better" — pick one and justify it.
- Don't add always-loaded instruction bloat; route detail to skills/memories.
- Don't claim something works without running the verification.
- Don't set up manual-upkeep processes when a hook/queue could maintain it automatically.

## Changelog

- 2026-06-08 — Profile created. Seeded from `~/.claude/CLAUDE.md`, project auto-memories, and run-logs.
  Most entries are `established` (drawn from repeated, codified policy); a few synthesized tendencies are
  high-confidence from run-log patterns.
