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

## How I work / collaboration

- Wants action, not narration. Prefers I implement changes over describing them. Keep prose short.
- Iterates rapidly with terse follow-ups ("yes", "try again", "do one more pass"). Treats me as a
  high-context collaborator, not a tutor.
- Protective of context/token budget — values keeping always-loaded instructions small and pushing
  detail into on-demand skills/memories. _(established — recurring theme across toolchain sessions)_
- Expects verification before "done" claims, including the **external effect** (deploy timestamp,
  delivered notification, actual running process) — not just that a local build/typecheck passed.
  Has repeatedly caught and corrected unverified or silently-broken automation (hooks-never-ran,
  false "resolved" states, green gates that missed a 500 page). _(established)_
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
  than assuming an index gets picked).
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
- **A business VPS that already has its own on-host coding agent is a standing dispatch target, not a
  request for permission.** Once a repo carries its own agent tooling (AGENTS.md/CLAUDE.md, GitNexus,
  run-log convention), finding a bug/fix there means dispatching the fix over SSH immediately in the
  same turn — never "should I fix this myself or do you want to." Only pause for something genuinely
  destructive/ambiguous (irreversible data loss, a prod cutover), not for "who runs the fix" when the
  answer is already the default. _(established — 2026-08-19/08-20, sharply worded: re-asking after
  already having established this practice read as not having internalized it; repo memory:
  `feedback_dispatch-fix-to-remote-host-agent`)_

## Domain & skill map

- **Strong:** Next.js + Supabase + Cloudflare Workers architecture (primary); Vue/Pinia/Tailwind (secondary); design-system/token thinking;
  AI-toolchain engineering (hooks, skills, agents, MCP wiring, dev-runner/fleet orchestration); prompt/context economics.
- **Active focus areas:** autonomous dev-runner reliability (pause/resume, remote-host parity, gate
  scoping), fleet/multi-VPS operations, memory/learning-loop maturity, UI consistency guardrails.
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
- Check what HQ already holds (calendar, DB, task state, git log) before asking him to re-tell
  something — asking for info the system already has produces a false picture and wastes his time.
  _(established — repo memory: `feedback_read-hq-data-before-asking`)_

## Open corrections to honor

_(Append new corrections here as `/consolidate-memory` promotes them from the signal queue. Retire once
internalized into CLAUDE.md or a skill.)_

- Write everything he reads in English (plans, docs, task titles, chat) — Vietnamese only for content
  that goes to someone else. Applies to porting research into downstream repos too: translate
  legal/contract vocabulary rather than copying it verbatim (keep only true identifiers untranslated).
  _(established — 2026-05-24 origin, refined 2026-08-03/08-04; repo memory:
  `feedback_questions-english-only`)_
- Verify the actual external effect of an action (deploy shipped, message delivered, process serving)
  before reporting it done — a false "resolved" costs more trust than an honest "not done yet." _(established)_
- Dev/code-writing work is scoped and assigned to a dev agent; general chat never writes code directly. _(established — repo memory: `feedback_dev-work-to-dev-agent`)_
- An earlier "deploy"/"go ahead" authorizes that specific action, not a later or larger batch of changes — re-confirm per turn/scope, even though his day-to-day instructions carry standing approval to execute the work itself. _(established — repo memory: `feedback_deploy-authorization-per-turn` + `feedback_operator-approval-is-standing`; the two coexist: standing approval covers doing the work, deploy/publish/send actions still need a fresh confirm each time)_

## Anti-patterns to avoid with me

- Don't pad responses with explanation he didn't ask for.
- Don't present a flat menu when he asked "which is better" — pick one and justify it.
- Don't add always-loaded instruction bloat; route detail to skills/memories.
- Don't claim something works without running the verification, including checking the real external effect.
- Don't set up manual-upkeep processes when a hook/queue could maintain it automatically.
- Don't polish UI/UX before every underlying action actually works end-to-end.
- Don't ask him to re-tell something HQ's own data (calendar/DB/git log) already holds.
- Don't re-verify or reframe a contradiction a second time once he's explicitly restated his position —
  one evidence-backed challenge is the right call, a second reads as not listening.
- Don't add collapse/hide/pin UI behavior when he asked for "compact" — that means vertical density.
- Don't ask "should I fix this myself or do you want to" when a repo/host already has its own on-host
  agent — dispatch there is the standing default, not a decision to re-litigate each time.

## Changelog

- 2026-06-08 — Profile created. Seeded from `~/.claude/CLAUDE.md`, project auto-memories, and run-logs.
  Most entries are `established` (drawn from repeated, codified policy); a few synthesized tendencies are
  high-confidence from run-log patterns.
- 2026-08-23 — Consolidation pass. Reviewed `~/.claude/logs/profile-signals.jsonl` (7,435 lines) and
  `personal-hq`'s `MEMORY.md`/`docs/run-logs`. Promoted two new provisional hypotheses (exploratory
  completeness over literal scope; functionality-before-polish sequencing). Folded three well-established
  repo-memory feedback atoms into cross-project "Proven preferences"/"Anti-patterns" (group dev tasks
  under one initiative, visual-first ops UI, detailed post-action summaries) since each has recurred
  across multiple sessions. Reconciled an apparent tension between "deploy authorization is per-turn"
  and "operator approval is standing" into one note — they are not contradictory, they cover different
  action classes (execution vs. publish/deploy). No facts retired. `lesson-signals.jsonl` does not exist
  yet — no self-correction lesson atoms to fold in this pass.
- 2026-09-18 — Consolidation pass. `profile-signals.jsonl` (6,208 lines since the 2026-08-23 archive)
  turned out to be mostly raw dev-runner self-narration fragments (low signal for genuine operator
  corrections), so cross-referenced personal-hq's `MEMORY.md` `feedback_*` entries instead — the
  curated view of the same underlying signal. **Retired one contradicted fact:** "group dev tasks under
  one initiative container" was reversed 2026-08-29 (HQ-DEV-204 shipped the opposite: dev/research
  tasks file with no parent by default); replaced with the current rule, anti-duplication half kept.
  **Promoted four new `established` facts** (≥2 observations or a single unambiguous operator statement
  treated as durable policy): accept-override-after-one-challenge, auto-mode-skips-ceremony,
  compact-means-vertical-density, read-HQ-data-before-asking. **Refined** the English/Vietnamese rule —
  narrower "think in English" superseded by the broader 2026-08-03 "everything I read is English,
  Vietnamese only for external content" rule, plus the 2026-08-04 legal-vocabulary-translation addendum.
  **Did not archive/truncate `profile-signals.jsonl` this pass** — no shell/file-copy tool was available
  in this session to move a 2.6MB file without loading it whole into context (unsafe at 86% context
  usage); the live file still holds all 6,208 lines. Next consolidation pass (or one with Bash access)
  should archive lines 1–6208 to `~/.claude/learning/archive/profile-signals-2026-09-18.jsonl` and
  truncate. No `lesson-signals.jsonl` exists yet.
- 2026-09-19 — Re-ran on request; verified the 2026-09-18 pass's edits are intact (digest, retired fact,
  four promoted corrections all still present). Read the 6 signal lines added since (6209–6214, now
  6214 total) — all cross-project technical postmortem notes (git-stash cross-contamination, a
  `vps-map` port-resolver race), not operator-behavior corrections, so nothing new to promote. Confirmed
  `profile-signals.jsonl` archiving is still blocked: attempted a full read this pass and it hard-failed
  (1.33M tokens, over the 25k read ceiling) — this is not a "no Bash available" workaround problem, it's
  that the file is categorically too large for a Read→Write round-trip regardless of tool access; the
  eventual fix needs a `mv`/`split`-capable shell session. Reset `~/.claude/logs/_consolidation-state.json`
  (`lastConsolidation` was still 2026-08-23 with stale 4,423/6,200 counters even though the 2026-09-18
  content pass had already happened) so the SessionStart nag reflects reality.
- 2026-09-20 — Re-ran on request. Read the 26 signal lines added since the prior pass (6215-6240): all
  are dev-runner/session-internal fragments again - a dev_events index task-spec (HQ-DEV-255, already
  captured in personal-hq's own project profile), tobuso-migration design notes (doc-templating engine
  choice, SQL/JSON hybrid storage), a home-router-wifi aside - zero are operator behavioral corrections.
  Same for the 4 new `_memory-curation-queue.jsonl` entries (personal-hq): all empty preferences/
  corrections/lessons arrays. **No beliefs promoted or retired this pass** - nothing rose above noise.
  Confirmed `profile-signals.jsonl` (6,240 lines) still cannot be archived without a shell session:
  manually chunking a Read-then-Write round-trip at the tool's ~110-lines/25k-token ceiling would take
  60+ round trips for content that is net-negative signal, not worth doing by hand this way.
  **Recommendation surfaced, not yet actioned:** the signal-logging hook appears to classify dev-runner
  internal task-spec/code-citation fragments as `kind:"correction"` - a source-side labeling bug, not a
  downstream filtering gap; fixing it (stop logging non-operator text as corrections) would do more for
  signal quality than any amount of consolidation-side archiving. Reset
  `~/.claude/logs/_consolidation-state.json` (28 corrections / 95 runs since the prior pass, all noise).
- 2026-09-21 — Re-ran on request. The counter had climbed to 214 corrections / 153 runs since the last
  reset despite the prior pass resetting it to 28/95 — confirms sizeable dev-runner activity volume, not
  a broken counter. Read all 213 new `profile-signals.jsonl` lines (6241-6453): every one is the same
  class of noise already diagnosed twice — dev-runner task-brief/plan-diff text re-logged verbatim across
  dozens of `sessionId`s (the runaway-loop-guard plan, the `listEventsForTask` no-LIMIT fix, the chat
  thread-switch loading-state brief), zero genuine operator behavioral corrections. **Promoted one new
  `established` fact** from personal-hq's `feedback_dispatch-fix-to-remote-host-agent` memory (not
  previously folded in): dispatching a fix to a business VPS's own on-host agent is the standing default,
  not something to re-ask permission for — added to Decision tendencies + Anti-patterns. Left two other
  candidate repo-memory atoms (`feedback_credential-harvesting-blocked`, `feedback_deterministic-paths-
  lookup`) unpromoted: the first is a system-classifier mechanism rather than an operator preference, the
  second duplicates CLAUDE.md's existing "Knowledge cache" policy. No facts retired. Still did not archive
  `profile-signals.jsonl` (6,453 lines) — same categorical blocker as 2026-09-19/20 (no shell session for
  a `mv`/`split` round-trip); the signal-logging source-bug recommendation from the prior pass still
  stands unactioned and remains the higher-leverage fix. Reset `~/.claude/logs/_consolidation-state.json`.
- 2026-09-22 — Re-ran on request. Read the 44 new `profile-signals.jsonl` lines (6454-6497) and the 23 new
  `personal-hq` curation-queue lines (1214-1236): same diagnosis as the last four passes — dev-runner
  task-brief/plan text re-logged as `kind:"correction"` (the HQ-DEV-257/261 fetch-robustness plan restated
  verbatim across five different `sessionId`s), zero genuine operator behavioral corrections. **No beliefs
  promoted or retired.** This is now the 5th consecutive pass with this exact finding — **elevating the
  standing recommendation**: the signal-logging hook's classifier is the actual bug (mislabels dev-runner
  internal narration as operator corrections), and fixing it would do more for signal quality than any
  further amount of consolidation-side review; still not actioned here since fixing a hook is outside this
  skill's scope, but it should not need a 6th confirmation. `profile-signals.jsonl` archiving remains
  blocked for the same reason as every prior pass — no Bash/shell tool available in this session's toolset
  either, so a `mv`/`split` round-trip on a file this size still isn't possible via Read/Write alone.
  Spent this pass's effort mainly on `personal-hq`'s project-profile instead (see that file's own
  Changelog): its digest block had grown to ~7,300 lines against the skill's ~40-80-line budget — the
  cross-project equivalent problem this profile has stayed disciplined about. Reset
  `~/.claude/logs/_consolidation-state.json`.
- 2026-09-23 — Re-ran on request. Read the 98 new `profile-signals.jsonl` lines (6498-6595) and 12 new
  personal-hq curation-queue lines (1237-1248): same dev-runner task-brief/plan-text-relogged-as-
  `kind:"correction"` pattern for a 7th straight pass (the Claude-token-verify/queue-manager-model plan
  text repeated across five `sessionId`s again), plus two isolated `"No i meant proper json shape data"`
  lines from a tobuso-migration session — too terse/context-free to derive a durable rule from. **No
  beliefs promoted or retired.** Still no Bash/shell tool in this session's toolset, so `profile-signals
  .jsonl` (6,595 lines) remains unarchived for the same categorical reason as every prior pass since
  2026-09-19 — not repeating the full diagnosis again per the 2026-09-22 note that it shouldn't need
  another confirmation. Spent this pass's real effort on `personal-hq`'s project-profile instead: folded
  in a substantial 8-task self-dev batch (HQ-DEV-262 through 269) that had landed since the prior same-day
  pass but wasn't yet reflected in Pending/in-flight. Reset `~/.claude/logs/_consolidation-state.json`.
