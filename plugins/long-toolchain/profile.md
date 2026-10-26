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
- On a pre-code plan/spec, reviews in dense itemized rounds (labeled R1/R2, S1-S8) and expects each point
  applied exactly as specified, answered with a diff of what changed — not a re-summary of the whole
  plan. Same density and response shape as his post-implementation code review. Worth proactively
  offering a pre-code review pass when a plan touches an existing column/table with real saved data or a
  concurrent/racy write path. _(provisional — one session, two rounds, streaming-kit `alert-customization`
  2026-09-29; repo memory: `feedback-iterative-plan-review-apply-diff`)_

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
  explicit Plan Mode or when he's asked for a written artifact. Extends to planning itself: once
  brainstorming has produced an approved spec, that **is** the plan — don't chain a second formal
  planning pass (e.g. writing-plans) on top before implementing ("you are planning twice"). Prefer fewer
  clarifying rounds generally — ask only the genuinely load-bearing questions, then build. _(established
  — 2026-07-07: "I didn't initiate you in plan mode, but auto mode. always proceed to build in auto
  mode."; repo memory: `feedback_auto-mode-skip-gates` + `feedback_no-double-planning`)_
- **Routine operational recoveries are standing defaults, not permission requests — except credential
  provisioning, which is reversed.** One established instance remains: a business VPS that already has
  its own on-host coding agent is a standing dispatch target — dispatch the fix over SSH in the same
  turn, never "should I fix this myself or do you want to" _(2026-08-19/08-20; repo memory
  `feedback_dispatch-fix-to-remote-host-agent`)_. The former second instance — "a Claude 401 on a fleet
  host means re-pin the longvu186 credential and retry without asking" — is **retired as of 2026-10-08**:
  after a `follow_shared` auto-copy left a stale/wrong account (`wassup`) live in a host's cached env for
  days (the tobuso "org disabled" incident), he shut the mechanism off entirely — "shut down any auto
  copy, I'll login manually into the server. we won't auto copy anymore, I'll provide logins for each
  server" — and it's now enforced in code (main@558de9f0): no shared-account fallback, fleet host token
  writes gated off by default, every fleet credential slot `unmanaged`. Never re-propose auto-copying or
  re-pinning a credential to a remote host without being asked; a 401/auth failure there is now a "tell
  him, he logs in manually" case, not a silent self-heal. _(established; repo memory
  `feedback_no-auto-credential-copy-to-hosts`, supersedes `feedback-copy-longvu186-auth-to-fleet-hosts`)_
  Only pause for something genuinely destructive/ambiguous (irreversible data loss, a prod cutover,
  minting a brand-new secret or access grant) — confirmed concretely 2026-07-08 (VPS hardening): even
  mid-session on an already-approved 9-phase plan, both generating a break-glass root password and naming
  the email/IdP for a new Cloudflare Access policy got stopped for a fresh explicit confirmation, because
  approving the plan approved the _goal_ ("set a break-glass password"), not the _specific values_ nobody
  had spoken aloud yet. A generated low-stakes value in the same session (an ntfy topic name — routing
  token, not a credential) went through without friction, so the line is credential/access-grant risk
  specifically, not "anything generated." _(established; tobuso memory
  `feedback-credential-and-access-grant-gating`)_
- **Domain modelling ≠ database design.** A DDD domain model is feature/business-focused and must not be
  critiqued for diverging from the schema; app-wide services (audit, notification, auth, lexicon) sit in
  a separate layer with deliberately zero edges to domain aggregates. _(provisional — one verbatim,
  emphatic statement, 2026-08-27; tobuso memory `feedback-domain-model-not-database-design`)_
- **A literal spec that would break sibling consistency needs a flag before it's built, not a guess.**
  When an instruction targets one instance of a repeated UI component and honoring it literally would
  make it diverge from its siblings, that's a conflict between the literal ask and his own system-first-
  UI standard — say so in a sentence and offer the consistent read, then build; don't implement literally
  and let production be the review, and don't over-correct to fully identical either (the fix is usually
  "same structure, different decorative layer," not picking an extreme). Same principle for screenshot
  validation: judge the screenshot as a designer would (mismatched siblings, stray rules), not just as
  proof the data loaded. _(provisional — one instance, 2026-08-12, two production round-trips before
  landing on the right layer; yen-tu memory `feedback_flag-spec-vs-consistency`)_
- **Client-side over AI/API by default for simple helpers.** For a "fill/copy this field from that one"
  style feature, implement it client-side rather than reaching for an API/LLM call, unless he explicitly
  asks for AI involvement. _(provisional — one instance, yen-tu memory `feedback_no-ai-for-copy-helpers`)_
- **A failed experiment disconfirms the experiment first, not the hypothesis.** Before writing a
  hypothesis off as ruled out, check the test was actually capable of confirming it — a defect recorded
  twice wrong (first "never built," then "ruled out" from an experiment that itself aborted the write
  being tested) only resolved once both sides (DB state and DOM state) were measured together in the same
  run. Writing "ruled out" into a task/doc makes the error durable for the next reader. Same root habit as
  measured-not-grepped estimates and guardrail positive-controls: validate the instrument before reading
  its output as a verdict. _(provisional — one instance, 2026-09-21 tobuso TASK-87; tobuso memory
  `feedback-failed-experiment-is-not-a-disproved-hypothesis`)_

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
  relaying it). _(established — second instance 2026-09-19, tobuso: two implementation agents reported
  "hard-blocked" on ssh/network after retries; relaying that verdict drew a direct "why are you blocked?
  you were never blocked" — one `ssh` probe in the main session returned immediately. Repo memory:
  `feedback-do-remote-work-directly-not-via-subagents`.)_
- Dev/code-writing work is scoped and assigned to a dev agent; general chat never writes code directly. _(established — repo memory: `feedback_dev-work-to-dev-agent`)_
- An earlier "deploy"/"go ahead" authorizes that specific action, not a later or larger batch of changes — re-confirm per turn/scope, even though his day-to-day instructions carry standing approval to execute the work itself. _(established — repo memory: `feedback_deploy-authorization-per-turn` + `feedback_operator-approval-is-standing`; the two coexist: standing approval covers doing the work, deploy/publish/send actions still need a fresh confirm each time)_
- A delete authorization covers the intent, not every row a query happens to match: enumerate the
  candidate set first and preserve rows that are evidence for an open question. _(provisional — one
  2026-09-20 Tobuso instance where 12 of 17 "stale" links were the sole evidence for an open client
  question; tobuso memory `feedback-authorization-to-delete-is-not-blanket`)_
- Never auto-copy/re-pin a credential to a remote host without being asked — he now provisions every
  fleet host login himself; HQ's job is to report an auth failure, not self-heal it by propagating a
  token. _(established — 2026-10-08, reversing the 2026-09-21/2026-10-07 standing-default reading;
  repo memory `feedback_no-auto-credential-copy-to-hosts`, enforced main@558de9f0)_
- An absent/disabled scheduled job (timer, cron) isn't necessarily drift — check for a deliberate
  disable (e.g. an `INTENTIONALLY_OFF` list) and ask about intent before recommending `enable --now`; he
  turns things off on purpose and re-enabling spends agent tokens he didn't ask for. _(provisional — one
  2026-10-08 instance, personal-hq research/questions/recommendations timers; repo memory
  `feedback_research-questions-recs-on-demand-only`)_
- A blanket "do all" permission doesn't erase attribution: when it includes setting
  secrets/credentials (even on his own say-so), report plainly "I set A, B, C (source: ...)" separately
  from what's still open, and fix any doc that would otherwise read as if he set it. _(provisional — one
  2026-10-16 instance, tobuso prod Worker secrets set under a blanket yes, docs still said "set by the
  operator"; tobuso-migration memory `feedback-report-credential-setting-as-mine`, ties to
  `feedback-credential-and-access-grant-gating`)_

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
  on-host agent) — just do it and report.
- Don't auto-copy, re-pin, or propagate a credential/token to a remote host without being asked — that
  mechanism was shut off 2026-10-08; a fleet host auth failure gets reported, not silently fixed.
- Don't recommend enabling/installing a disabled timer or automation without first checking whether it
  was deliberately turned off — absence isn't automatically drift.
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
- 2026-09-18 — Consolidation pass via personal-hq `feedback_*` memories (signal file was mostly
  dev-runner self-narration). **Retired** "group dev tasks under one initiative container" (reversed
  2026-08-29, HQ-DEV-204). **Promoted** four established facts: accept-override-after-one-challenge,
  auto-mode-skips-ceremony, compact-means-vertical-density, read-HQ-data-before-asking. Refined the
  English/Vietnamese rule.
- **2026-09-19 → 2026-10-20 (41 passes, condensed 2026-10-21)** — Across this ~5-week span,
  `profile-signals.jsonl` and personal-hq's curation queue grew from ~6,600 to 7,761 / 1,472 lines, and
  were **almost entirely dev-runner/plan-narration text mislabelled `kind:"correction"`** by the logging
  hook (re-logged boilerplate, test output, changelog blurbs across many `sessionId`s) — a genuine
  cross-project operator correction surfaced roughly 1 pass in 10; real signal instead came from sweeping
  per-project `memory/feedback-*.md` files each pass. Real promotions in this span, in order: dispatch-
  fix-to-remote-host-agent (09-21); sweep-stores-before-asking generalized to established, now covering 2
  projects + the client (09-23); no-double-planning merged into auto-mode-skip-gates, plus two new
  provisionals — flag-spec-vs-consistency, client-side-over-ai-for-simple-helpers (09-28); citations added
  to credential/access-grant-gating and subagent-blocked-verdict (10-03); iterative-plan-review-apply-diff
  and failed-experiment-is-not-a-disproved-hypothesis promoted provisional (10-05); **retired** the
  "re-pin a fleet credential and retry without asking" half of the standing-recoveries bullet and promoted
  its established replacement (never auto-copy/re-pin — operator provisions every host login himself),
  plus a new provisional on not re-enabling a deliberately-disabled timer (10-09); report-credential-
  setting-as-mine promoted provisional (10-16). Also surfaced and never applied: a stale unattended draft
  (`profile.md.draft` + `_consolidation-draft-ready.json`, generated 2026-09-23T08:45 against an
  11-passes-stale snapshot) that every pass since 2026-09-25 correctly declined to apply and could not
  delete (toolset has no Bash/file-delete). **Standing unresolved issues, raised directly to the user
  2026-09-26/27, still unactioned:** (1) archiving of `profile-signals.jsonl` into
  `~/.claude/learning/archive/` per the Guardrails section has never been possible — every pass's toolset
  was Read/Write/Edit/Glob/Grep/MCP only, no shell/file-move/truncate tool; (2) the real fix is upstream —
  the signal-logging hook's `kind:"correction"` classifier tags narration/test-output text as a
  correction, which is what manufactures the noise in the first place. Separately, this same span is when
  `memories/repo/project-profile.md` was found to have silently grown to ~8,000 lines with its entire
  history living inside the always-injected digest block (10-01 rewrite to digest+read-on-demand shape;
  10-14 further Pending-section compression) — see that file's own Changelog.
- 2026-10-21 (explicit user request, paired with a `/consolidate-project` pass) — 42nd pass since
  2026-09-19. `profile-signals.jsonl` gained 38 lines (7762–7799) and personal-hq's curation queue 19
  (1473–1491): same dev-runner/plan-narration-mislabelled-`kind:"correction"` pattern as every pass in the
  condensed span above (tonight's own HQ-DEV-342 AI-fix-blocked-detection narration, HQ-DEV-340/343
  changelog text, re-logged verbatim across 5+ `sessionId`s) plus one genuine product-direction message
  (operator wants chat to stop grouping ordinary messages and surface agent-produced images inline instead
  of a bare path) — real feedback, but scoped to the personal-hq chat UI itself and already being built as
  HQ-DEV-343 (tracked in that project's own memory), not a generalizable cross-project operator-behavior
  correction. Re-swept every project's `memory/feedback_*.md`/`feedback-*.md`: one new file since the last
  sweep, tobuso-migration's `feedback-control-plane-ui-conventions` (2026-10-21, sidebar-only nav + input
  help text for `/config/*` pages) — project-specific control-plane UI mechanics, correctly out of scope
  here (same disposition as the 2026-10-21 chat-UI message). No facts promoted, retired, or contradicted
  this pass. The real work this pass was on this file itself: condensed the 28 near-duplicate
  "Nth straight pass, nothing new" Changelog entries from 2026-09-19 through 2026-10-20 into the single
  dated block above, per the skill's own rewrite-not-append directive applied to its own history — the
  Changelog section had become exactly the kind of disconnected-pieces accumulation this skill exists to
  prevent. Archiving of `profile-signals.jsonl` (7,799 lines) remains blocked for the same toolset reason
  as the entire condensed span; not re-raising the two standing fixes again (already surfaced directly to
  the user 2026-09-26/27). Reset `_consolidation-state.json`. Watermark for next pass: line 7799 (signals)
  / 1491 (curation queue).
- **2026-10-22 → 2026-10-25 (passes 43–46, condensed 2026-10-26)** — Same pattern as the 09-19→10-20
  span: `profile-signals.jsonl` crept 7799→7815 and the curation queue 1491→1506, almost entirely
  dev-runner/changelog-writing-task narration re-logged as `kind:"correction"`, plus one genuine
  housekeeping finding on 10-24 — **root-caused why the standing archiving blocker can't be closed in an
  agent pass**: a 1,500-line slice of `profile-signals.jsonl` alone is ~324,000 tokens, so moving the
  full file through Read/Write/Edit would take 60-70+ chunked round trips; it needs a non-LLM rotation
  script (keep last N days live, gzip the rest to `~/.claude/learning/archive/`), not another agent pass
  attempting it. No facts promoted, retired, or contradicted across these four passes.
- 2026-10-26 (explicit user request, paired with a `/consolidate-project` pass) — 47th pass since
  2026-09-19. `profile-signals.jsonl` gained 92 lines (7816–7907) and personal-hq's curation queue
  gained 6 (1507–1512). Same standing pattern: the bulk is identical templated worktree boilerplate
  (the "convention; only touch this if..." / "Should be committed soon..." / POS-cart-bug block)
  re-logged verbatim across 7 different dev-runner `sessionId`s, plus task-scoped BCNV reconciliation-
  revert design narration and two bcnv-specific remarks ("don't run any automation, fix root cause
  first"; "usage consumption is low") that are contextual to that one conversation, not general
  operator-behavior corrections. Re-swept every project's `memory/feedback*.md`: the only files not
  already reflected here (`feedback_hq-must-match-code-server-capability`,
  `feedback_verify-dev-runner-ui-before-merge`, `feedback_compassionate-chief-of-staff`,
  `feedback_operator-approval-is-standing`) are all 64–91 days old and already covered — the first two
  are personal-hq-project-scoped (dev-runner/HQ-parity, not a cross-project trait), the mental-health
  one is already the digest's "help must reduce load, not add ceremony or shame-based framing" line, and
  the approval one is already in "Open corrections to honor". No facts promoted, retired, or
  contradicted. Reset `_consolidation-state.json`. Watermark for next pass: line 7907 (signals) / 1512
  (curation queue).
