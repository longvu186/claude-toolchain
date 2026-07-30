---
name: anti-slop-writing
description: "Remove the 'AI smell' from prose in English and Vietnamese — the lexical fingerprint (delve/underscore/tapestry), structural tells (contrast reframe 'it's not X, it's Y', rule-of-three, restate-everything conclusions), and Vietnamese translationese (passive được/bị, một cách+adj, việc/sự bloat, negation pivot, missing tone particles). Every ban is paired with a positive rewrite; ends with a self-check. Trigger: write/rewrite an article, post, essay, email, docs, README, announcement, course/lesson content, caption; 'make this sound human', 'does this sound like AI', de-slop, anti-slop, remove AI tells. NOT for code. Visual design defers to hallmark; Vietnamese brand voice/superlatives defer to vi-copywriting."
version: 1.0.0
---

# Anti-Slop Writing

Makes prose read like a person wrote it — in English or Vietnamese. Built from measured evidence, not vibes: the Kobak et al. excess-vocabulary corpus study (*Science Advances* 2025), Wikipedia's WikiProject AI Cleanup tell-catalog, and the Brands Vietnam editorial teardown of ChatGPT/Gemini Vietnamese output.

This skill owns *words and structure*. Two neighbors own the rest — defer to them:
- **Visual/UI design** → the `hallmark` skill (anti-AI-slop *design*, 58 slop gates).
- **Vietnamese brand voice, superlatives, register/pronouns** → the `vi-copywriting` skill. Anti-slop and brand-voice are separate audits; when writing Vietnamese, run both.

## The core principle (this is why "banned-word lists" alone fail)

**No single word or device proves AI, and negation-only instructions backfire.** The rule-of-three, the em-dash, and the "not X, but Y" pivot are all legitimate human moves — only *abnormal density* reads as machine-written. Cognitive research is blunt about why banning backfires: a reader (and a model) retains the banned word, not the correction — negation "didn't function as an eraser." So the method that survives every source is:

1. **Pair every ban with a concrete positive rewrite.** Not "don't use delve" — "use *look at* or *examine*."
2. **Lead with bad→good examples**, not rules. Few-shot contrast beats rule lists.
3. **Keep the ban list short and prioritized.** Too many negatives confuse and backfire (Anthropic's "light touch").
4. **End with a self-check** so the draft audits patterns the generation step introduced unconsciously.
5. **Add a voice sample when you can** — 1–2 samples of the target human's writing, matched for rhythm and vocabulary, does more than any blacklist.

Highest-ROI rules to enforce first (front-load these three per language):
- **English**: contrast reframe · vague sourcing · restate-everything conclusion.
- **Vietnamese**: `không phải… mà là…` · passive `được/bị` · recap closer `Tóm lại / Nhìn chung`.

## Genre discipline is the real cure

Slop is defeated differently by genre; pick the mode before editing lexicon.

- **News / announcement** — inverted pyramid (most important facts first, descending so an editor cuts from the bottom); active voice, third person, one idea per sentence; concrete nouns/verbs ("The mayor vetoed the bill," not "took action on the legislation"); named attribution, two sources for significant claims. Kill throat-clearing ("There are many reasons why this matters"). Avoid chronological retelling.
- **Analysis / business** — state a real thesis that takes a position; show genuine uncertainty where it exists and name the strongest counter-evidence instead of false balance; every claim earns a number, named source, or worked example; let a stance show (the flat "even tone" is itself a tell).
- **Course / educational** — scaffold concept → worked example → learner attempt *without announcing the scaffold*. Ban "In this section we will explore…" and "By the end of this lesson you will…" as reflexive openers. State the idea, show a concrete example first, vary the example count to the material (never a forced three).

## Positive spine (the "do this instead")

Specificity over abstraction — named people, places, dates, exact numbers — is the antidote every slop taxonomy agrees on. Add: concrete verbs, earned conclusions, deliberately varied sentence length, a visible point of view, verifiable sourcing, and a digression or real detail a machine wouldn't invent.

## The lexical + pattern detail lives in the references

Load the one for your language; each holds the full blacklist-with-alternatives, the sentence anti-patterns with bad→good rewrites, and its own self-check:

- `references/english-guide.md` — Tier 1/2/3 blacklists → plain words; 10 sentence/paragraph anti-patterns; the em-dash and burstiness fixes.
- `references/vietnamese-guide.md` — câu mở bài "mùi AI", buzzword metaphors, translationese (được/bị, một cách+adj, việc/sự, đến từ), negation pivot, tone particles, fabricated-source check.
- `references/voice-sample-example.md` — a worked example of the highest-ROI step: a real Vietnamese brand voice (The Pen Lab battle-rap analysis) distilled into a voice profile with verbatim excerpts, showing how to bind to a human's rhythm/vocabulary rather than lean on the blacklist.

## Self-check — run on the finished draft (both languages)

1. Scan for the highest-signal tells for the language; justify or replace each hit.
2. Find every "not X, it's Y" / "không phải… mà là…" / "not only… but also" — delete the rejected half, state the claim directly.
3. Count hedges per paragraph; if >3, cut.
4. Is every factual claim attributed to a nameable source or number? If not, cut or specify. (Verify names/numbers — AI fabricates them.)
5. Does the conclusion recap or advance? If it recaps, rewrite to end on one action/takeaway.
6. Read three consecutive sentences aloud — do their lengths differ noticeably? If not, vary them.
7. Count spaced em-dashes; convert most to commas/periods/parentheses.
8. Would a knowledgeable colleague find one specific, checkable, non-obvious fact here? If not, it's still slop.

## Caveats (build these in so you don't over-correct)

- **No single sign proves AI authorship.** The rule-of-three, the em-dash, and the negation pivot are legitimate human devices; only abnormal *density* signals AI. Don't strip good writing into stilted writing.
- **Detectors are revision aids, never proof.** Burstiness (sentence-length variation) and perplexity are the two metrics under every detector, but they false-positive ~61% on non-native English writers and on formal/technical genres. Treat a low score as a nudge to vary sentences, not a verdict or an accusation.
- **The lexical layer shifts fast; the structural/translationese layers are stable.** New "excess vocabulary" tells appear every few months (2023's are mostly gone); invest maintenance in the structural and translationese rules, and refresh the word lists quarterly.
- **Some Vietnamese items are illustrative (`minh họa`), not sourced to an AI-writing article** — the nominalizer and tone-particle rewrites rest on general Vietnamese-language principles (active-voice preference, native word order), not a study tying them to "văn AI." They're marked as such in the reference.

## Sources
- Kobak, González-Márquez, Horvát & Lause, "Delving into LLM-assisted writing in biomedical publications through excess vocabulary," *Science Advances* 2025 (arXiv 2406.07016).
- Juzek & Ward, "Why Does ChatGPT 'Delve' So Much?", COLING 2025.
- Wikipedia, WikiProject AI Cleanup — "Signs of AI writing."
- The Atlantic on negative parallelism ("most recognizable and stubbornly persistent tell"); Grammarly's "align with" 43× figure.
- Brands Vietnam Help Desk, "Dấu hiệu nhận biết nội dung được viết bởi AI" (23/09/2025); Công dân & Khuyến học (VCCorp); Tuổi Trẻ; Thanh Niên; FPT Shop.
- Anthropic prompting guidance; Zack Witten ("light touch"); 16x Eval "Pink Elephant"; arXiv 2401.17390 (contrastive in-context examples).
