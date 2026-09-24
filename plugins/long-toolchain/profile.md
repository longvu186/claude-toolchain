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

- **Who:** Solo builder, Vietnamese (thinks/reasons in English). Builds production web apps **and** heavily engineers his own AI toolchain (personal-hq). Highly systematic; invests in automation and tooling, not just features.
- **Comms:** Terse, direct. Action over explanation — implement, don't describe. Challenges assumptions and asks "is X actually better than Y?" — expects evidence, not agreement.
- **Decision lens:** Architecture over wording. Automation over polling/manual upkeep. Prompt-budget conscious (keep always-loaded context tiny). Verify before claiming done — including the external effect, not just a local build passing.
- **Before asking him anything:** sweep what the system already holds (HQ data, git log, memories, closed tasks, past sessions). Most "open questions" are already answered somewhere.
- **Hard rules:** i18n Vietnamese-first (never hardcode VN text). `typecheck`+build must pass before any deploy. UI validation is screenshot-backed, not code-only. Styled confirm modals, never native `window.confirm`. System-first UI (shared tokens/shells before page-local).
- **Stack:** Primary architecture is **Next.js + Supabase + Cloudflare Workers** (+ Tailwind). Vue 3 `<script setup lang="ts">` + Pinia is a secondary framework, not the default. Also Vercel, Bubble.io. Never call Supabase directly in components — route through the data layer.
- **Tooling:** Claude Code is the primary (and now only) AI coding tool. GitNexus for structure/impact. Crawl4AI for web reads. Context7 only for version-sensitive APIs.

<!-- digest:end -->

---

## Identity & context

- Solo developer/operator. Vietnamese; UI work is Vietnamese-first bilingual. Everything he reads —
  plans, docs, tasks, chat replies — is English; Vietnamese is reserved for content handed to someone
  else (published posts/captions, survey text, on-set prompts, brand copy). Refined 2026-08-03 from the
  narrower 2026-05-24 "think in English" rule once it became clear plans/docs/task titles stay English
  too, not just internal reasoning.
- Two parallel tracks: (1) shipping real apps across ~7 businesses run through `personal-hq` (Mr. TukTuk,
  BCNV, Shield, The Pen Lab, Tobuso, Streamer Kit, Redy, wehear, mrtuktuk), and (2) building/optimizing a
  sophisticated personal AI toolchain (dev-runner, fleet, memory system) that is a first-class project,
  not a side activity.
- Runs a heavily autonomous dev pipeline (overnight batch runs, dev-runner, fleet of remote hosts) and
  reviews its output rather than hand-writing most code himself. Operator mental health is a standing
  factor: help must reduce load, not add ceremony or shame-based framing.
- Works in long, iterative sessions, often overnight/unattended. Comfortable driving many short
  follow-up runs rather than one big spec.
- Some projects (e.g. Tobuso) have an external client (Andrew) whose rulings are authoritative; he acts
  as the intermediary and doesn't want the client asked things the record already answers.

## How I work / collaboration

- Wants action, not narration. Prefers I implement changes over describing them. Keep prose short.
- Iterates rapidly with terse follow-ups ("yes", "try again", "do one more pass"). Treats me as a
  high-context collaborator, not a tutor.
- Protective of context/token budget — values keeping always-loaded instructions small and pushing
  detail into on-demand skills/memories. _(established — recurring theme across toolchain sessions)_
- Expects verification before "done" claims, including the **external effect** (deploy timestamp,
  delivered notification, actual running process) — not just that a local build/typecheck passed.
  Has repeatedly caught and corrected unverified or silently-broken automation (hooks-never-ran,
  false "resolved" states, green gates that missed a 500 page, a boundary lint that was green because it
  matched nothing). _(established)_
- Wants exploratory completeness on open-ended work — "cover everything in an explorative manner, not
  just the things I asked for" — rather than narrowly satisfying the literal ask. _(provisional — one
  direct statement, but consistent with the batch-review / multi-agent-validation pattern seen across
  dev-runner sessions)_
- Sequences work functionality-first: get every action actually working end-to-end before spending a
  pass on UI/UX polish or optimization. _(provisional — one direct statement: "make sure all actions are
  working first before we actually proceed with optimizing UI/UX")_

## Decision tendencies

- **Challenges before adopting.** Routinely asks whether a proposed tool/pattern is actually better than
  the current one (agentmemory vs file memory, "do I need semgrep?", "is anything else worth installing?").
  Give a real comparison with a recommendation, not a menu.
- **Architecture over surface fixes.** Believes durable wins come from structure, not wording tweaks.
  Frame fixes at the system level — visible again in the toolchain's own "learn from failures" / gate
  proposals being aimed at the mechanism, not the symptom.
- **Automation over manual upkeep.** Prefers mechanisms that self-maintain (hooks, queues, gates) over
  processes that depend on him remembering to run them. Manual logs he set up tend to get abandoned.
- **Evidence-driven.** Wants screenshot-backed UI validation, build gates, raw-evidence artifacts kept
  append-only, and root-cause diagnosis over assumption (e.g. insisting on `EXPLAIN QUERY PLAN` rather
  than assuming an index gets picked). Estimates must be measured, not grepped — a size estimate that
  inflated a refactor (62 "references" vs 38 real statements) and got it wrongly deferred is the kind of
  thing he catches. _(established)_
- **Operator time is the scarce resource, not compute.** Repeated asks to make drift/breakage
  self-announcing (docs-index drift, dead fleet credentials, stale estimates) instead of relying on him
  to notice — a specific case of the automation-over-manual-upkeep tendency.
- **Accepts an override after one evidence-backed challenge.** When live evidence contradicts his
  stated intent, raise it once with the strongest evidence — that's correct, it catches real risk. If he
  restates his position, accept it and move on; he has business/product context (e.g. deliberate
  placeholder data) that isn't derivable from code/DB inspection alone. A second challenge or reframing
  reads as not listening, even when technically accurate. _(established — 2026-09-14 Tobuso incident,
  explicit "do not question me anymore"; repo memory: `feedback_accept-operator-override-after-one-check`)_
- **In Auto Mode, ceremony after a conversationally-approved design is a redundant blocker.** Once he's
  said "yes, build it" in conversation, proceed straight to implementation — don't insert a separate
  spec-doc-to-file + second-review + formal handoff gate for something already agreed. Still explore
  options and get an explicit yes first; this only cuts the paperwork after that yes. Does not apply in
  explicit Plan Mode or when he's asked for a written artifact. _(established — 2026-07-07: "I didn't
  initiate you in plan mode, but auto mode. always proceed to build in auto mode."; repo memory:
  `feedback_auto-mode-skip-gates`)_
- **Routine operational recoveries are standing defaults, not permission requests.** Two established
  instances: (1) a business VPS that already has its own on-host coding agent is a standing dispatch
  target — dispatch the fix over SSH in the same turn, never "should I fix this myself or do you want
  to" _(2026-08-19/08-20; repo memory `feedback_dispatch-fix-to-remote-host-agent`)_; (2) a Claude 401 on
  a fleet host means re-pin the longvu186 credential and retry without asking — "always do that… we have
  always done that" _(2026-09-21; tobuso memory `feedback-copy-longvu186-auth-to-fleet-hosts`)_. Only
  pause for something genuinely destructive/ambiguous (irreversible data loss, a prod cutover, minting a
  brand-new secret or access grant). _(established)_
- **Domain modelling ≠ database design.** A DDD domain model is feature/business-focused and must not be
  critiqued for diverging from the schema; app-wide services (audit, notification, auth, lexicon) sit in
  a separate layer with deliberately zero edges to domain aggregates. _(provisional — one verbatim,
  emphatic statement, 2026-08-27; tobuso memory `feedback-domain-model-not-database-design`)_

## Domain & skill map

- **Strong:** Next.js + Supabase + Cloudflare Workers architecture (primary); Vue/Pinia/Tailwind (secondary); design-system/token thinking;
  DDD / modular-monolith domain modelling; AI-toolchain engineering (hooks, skills, agents, MCP wiring,
  dev-runner/fleet orchestration); prompt/context economics.
- **Active focus areas:** autonomous dev-runner reliability (pause/resume, remote-host parity, gate
  scoping), fleet/multi-VPS operations, memory/learning-loop maturity, UI consistency guardrails,
  edge-to-DB latency (Worker placement vs DB region).
- _(Leave gaps unstated unless evidence shows a recurring stumbling block — do not invent weaknesses.)_

## Proven preferences (see CLAUDE.md for full policy)

- i18n mandatory, Vietnamese-first; preserve diacritics; proofread high-salience labels. _(established)_
- Planning docs: simple `docs/specs/active/<slice>/{brief,spec,validation}.md` — not dashboards/matrices. _(established)_
- Destructive/privilege actions → reusable styled confirmation modal. _(established)_
- System-first UI: shared tokens/variants/layout shells before page-local styling. _(established)_
- Build gates (`typecheck` + build) before any deploy; close code sessions with scoped validation + run log. _(established)_
- API reverse-engineering: raw evidence artifacts append-only; add index files, never rewrite captures. _(established)_
- Dev/research tasks don't need a parent container — file with no `parentTaskId` unless a genuine
  regular task owns it; a regular task still keeps sub-tasks. The underlying anti-duplication principle
  (don't spin up a near-identical container per task) still stands, just not via mandatory grouping.
  _(established — 2026-08-29 reversal of the 2026-08-16 "always group under one container" rule; repo
  memory: `feedback_group-dev-tasks-under-one-initiative`, shipped HQ-DEV-204)_
- Prefer visual/diagrammatic operations UI (bars, colour, diagrams) over raw tables; idle state reads as neutral grey, not alarm red. _(established — repo memory: `feedback_visual-first-operations-ui`)_
- After any real (non-trivial) autonomous action, give a detailed itemized summary of what happened — skip only the raw shell/bash transcript. _(established — repo memory: `feedback_detailed-ops-summaries`)_
- "Compact" means tighter **vertical** density (row height, padding, line-height) — never narrower or
  collapsible unless he explicitly asks. Don't add hide/collapse/pin behavior he didn't request; measure
  the actual space gained rather than asserting it "now fits." _(established — repo memory:
  `feedback_compact-means-vertical-density`)_
- Sweep existing stores before asking him **or his client** anything — HQ data (calendar, DB, task
  state, git log), memories, closed control-plane task comments, prior session transcripts. Asking for
  info the system already has wastes his time and makes the project look disorganised to the client.
  _(established — now observed in two projects: personal-hq `feedback_read-hq-data-before-asking`;
  tobuso `feedback-sweep-stores-before-asking-client`, 2026-09-19, where 7 of 8 "schema-blocking"
  client questions were already answered in the record)_

## Open corrections to honor

_(Append new corrections here as `/consolidate-memory` promotes them from the signal queue. Retire once
internalized into CLAUDE.md or a skill.)_

- Write everything he reads in English (plans, docs, task titles, chat) — Vietnamese only for content
  that goes to someone else. Applies to porting research into downstream repos too: translate
  legal/contract vocabulary rather than copying it verbatim (keep only true identifiers untranslated).
  _(established — 2026-05-24 origin, refined 2026-08-03/08-04; repo memory:
  `feedback_questions-english-only`)_
- Verify the actual external effect of an action (deploy shipped, message delivered, process serving)
  before reporting it done — a false "resolved" costs more trust than an honest "not done yet." Extends
  to guardrails (positive-control a lint/policy check on a deliberate violation before trusting green)
  and to "blocked" reports (a subagent's "hard-blocked" is not evidence — probe it yourself before
  relaying it). _(established)_
- Dev/code-writing work is scoped and assigned to a dev agent; general chat never writes code directly. _(established — repo memory: `feedback_dev-work-to-dev-agent`)_
- An earlier "deploy"/"go ahead" authorizes that specific action, not a later or larger batch of changes — re-confirm per turn/scope, even though his day-to-day instructions carry standing approval to execute the work itself. _(established — repo memory: `feedback_deploy-authorization-per-turn` + `feedback_operator-approval-is-standing`; the two coexist: standing approval covers doing the work, deploy/publish/send actions still need a fresh confirm each time)_
- A delete authorization covers the intent, not every row a query happens to match: enumerate the
  candidate set first and preserve rows that are evidence for an open question. _(provisional — one
  2026-09-20 Tobuso instance where 12 of 17 "stale" links were the sole evidence for an open client
  question; tobuso memory `feedback-authorization-to-delete-is-not-blanket`)_

## Anti-patterns to avoid with me

- Don't pad responses with explanation he didn't ask for.
- Don't present a flat menu when he asked "which is better" — pick one and justify it.
- Don't add always-loaded instruction bloat; route detail to skills/memories.
- Don't claim something works without running the verification, including checking the real external effect.
- Don't set up manual-upkeep processes when a hook/queue could maintain it automatically.
- Don't polish UI/UX before every underlying action actually works end-to-end.
- Don't ask him (or his client) something the existing record already holds.
- Don't re-verify or reframe a contradiction a second time once he's explicitly restated his position —
  one evidence-backed challenge is the right call, a second reads as not listening.
- Don't add collapse/hide/pin UI behavior when he asked for "compact" — that means vertical density.
- Don't ask permission for a routine recovery that is already a standing default (dispatch to an
  on-host agent, re-pin fleet auth) — just do it and report.
- Don't size or defer work on a grep count — measure real call sites before calling something "too big."
- Don't relay a subagent's "blocked" verdict without probing it yourself.

## Changelog

- 2026-06-08 — Profile created. Seeded from `~/.claude/CLAUDE.md`, project auto-memories, and run-logs.
  Most entries are `established` (drawn from repeated, codified policy); a few synthesized tendencies are
  high-confidence from run-log patterns.
- 2026-08-23 — Consolidation pass. Reviewed `profile-signals.jsonl` (7,435 lines) and personal-hq's
  `MEMORY.md`/run-logs. Added two provisional hypotheses (exploratory completeness; functionality-before-
  polish). Folded three repo-memory feedback atoms into cross-project preferences (group dev tasks,
  visual-first ops UI, detailed post-action summaries). Reconciled per-turn deploy authorization vs.
  standing approval (different action classes). No facts retired.
- 2026-09-18 — Consolidation pass via personal-hq `feedback_*` memories (signals file was mostly
  dev-runner self-narration). **Retired** "group dev tasks under one initiative container" (reversed
  2026-08-29, HQ-DEV-204). **Promoted** four established facts: accept-override-after-one-challenge,
  auto-mode-skips-ceremony, compact-means-vertical-density, read-HQ-data-before-asking. Refined the
  English/Vietnamese rule.
- 2026-09-19 → 2026-09-23 (six passes, condensed here) — Every pass found new `profile-signals.jsonl`
  lines to be dev-runner/agent narration mislabelled `kind:"correction"` (plan text re-logged across many
  `sessionId`s), zero genuine operator corrections. Only promotion in that span: dispatch-fix-to-remote-
  host-agent (2026-09-21). Standing recommendation, repeated since 2026-09-20: **fix the signal-logging
  hook's classifier at source** — it is the real signal-quality bug. Archiving of `profile-signals.jsonl`
  was blocked each pass (no shell tool / file too large for Read→Write).
- 2026-09-23 (second pass, unattended draft) — Read the 14 new signal lines (6596–6609): all tobuso
  nav-latency audit narration (parallelise `user_type` round-trip, collapse `"use cache"` entries,
  share-structure wave) — noise again, 8th straight pass. Real input this pass was tobuso-migration's
  per-project `feedback-*` memories, not previously folded in. **Promoted to established:** sweep-stores-
  before-asking (now 2 projects; generalised to include the client; added to digest); standing-default
  recoveries (merged dispatch-to-on-host-agent with the new copy-fleet-auth instruction). **Extended**
  the verify-external-effect correction with guardrail positive-controls and subagent "blocked" claims;
  added measured-not-grepped estimates under Evidence-driven. **New provisional:** domain model ≠
  database design; delete authorization isn't blanket. **Skipped:** credential/access-grant gating
  (classifier mechanism, not a preference — only reflected as the "pause" carve-out), tailscale/SQL/infra
  lessons (project-technical, belong in repo memory/tech-pitfalls). Condensed the six repetitive
  2026-09-19→23 changelog entries into one. No facts retired. No `lesson-signals.jsonl` exists.
- 2026-09-25 — Re-ran on request (nightly). This pass's real work was applying the draft above: it sat
  unconsumed in `~/.claude/profile.md.draft` (generated 2026-09-23T08:45 by the headless auto-consolidate
  worker) through the entire 2026-09-24 nightly pass, which worked from the live file instead of checking
  for a pending draft. Read the new `profile-signals.jsonl` lines since (6610–6726, +117) and the
  personal-hq curation queue (1249–1266): same dev-runner-narration-mislabelled-as-correction pattern,
  9th/10th straight pass with zero new operator corrections from that source — no further promotions.
  Could not physically delete/move `~/.claude/profile.md.draft`, `~/.claude/logs/_consolidation-draft-
ready.json`, or archive the report — this session's toolset has no Bash/file-delete tool, only
  Read/Write/Edit, so a true `/apply-consolidation`-style cleanup isn't possible from here; wrote a copy
  of the report to `~/.claude/learning/archive/consolidation-2026-09-23.md` and left the originals in
  place with this changelog entry as the record that they've been consumed (do not re-apply them again).
  `profile-signals.jsonl` (6,726 lines) archiving remains blocked for the same categorical reason as
  every pass since 2026-09-19. `lesson-signals.jsonl` still does not exist. Reset
  `~/.claude/logs/_consolidation-state.json`.
