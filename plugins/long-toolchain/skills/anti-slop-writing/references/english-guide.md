# English Anti-Slop Guide

Full lexical + pattern detail. The operative rules, genre modes, and self-check are in the parent `SKILL.md` — this file is the blacklist and the bad→good rewrites. **None of these words is banned in isolation. Flag them when they cluster, when they replace a concrete verb, or when they inflate importance the facts don't earn.**

## (a) Lexical blacklist → what to write instead

**Tier 1 — corpus-verified "excess vocabulary"** (Kobak et al., *Science Advances* 2025):
delve → look at, dig into, examine · underscore → show, stress · intricate → complex, detailed · meticulous → careful · pivotal → key, central · crucial → important (or cut) · comprehensive → complete, full · utilize → use · align (with) → match, fit, agree · realm → area, field · boast → has · showcase → show.

**Tier 2 — Wikipedia / Forbes / slop-guide clichés:**
tapestry, "rich tapestry," "serves as a testament," "plays a vital role," "stands as a," "a beacon of," "in today's fast-paced world," "in the ever-evolving landscape," "navigate the landscape/complexities," game-changer, unlock, elevate, "at the end of the day," "when it comes to," "it's important to note/remember," "it's worth noting," "no discussion would be complete without," moreover/furthermore/additionally chains.

**Tier 3 — 2026 "new tells"** (Jodie Cook, Forbes): quietly, shift, matters, shape, land, actually, real, earn, "the work," hold, pull, compound, signal, "built different" — abstract fillers or unearned intensifiers.

## (b) Sentence / paragraph anti-patterns (bad → good)

1. **Contrast reframe / negation pivot** — the hardest tell to prompt away ("AI's most recognizable and stubbornly persistent tell").
   ❌ "It's not about the tool, it's about the mindset."
   ✅ "Mindset determines whether the tool helps." (Delete the rejected half; rewrite the positive claim as a direct sentence. Allow contrast only to correct a specific factual/technical/legal/numeric mistake.)
2. **"Not only… but also" parallelism.**
   ❌ "The policy not only cut costs but also boosted morale."
   ✅ "The policy cut costs 12% and, in the staff survey, raised morale scores."
3. **Rule-of-three padding.**
   ❌ "efficient, scalable, and future-proof."
   ✅ the number the content demands — often one specific claim: "It processes 10,000 records a second."
4. **Hollow significance.**
   ❌ "This development plays a vital role in the industry."
   ✅ "Three of the five largest carriers adopted it within a year."
5. **Vague sourcing.**
   ❌ "Studies show… experts say…"
   ✅ "A 2025 McKinsey survey of 1,400 firms found…" If you can't name it, cut the claim.
6. **Hedging clusters.**
   ❌ "It's arguably worth noting that this may potentially help to some extent."
   ✅ "This cuts onboarding time by about a day." More than ~3 hedges per paragraph → rewrite.
7. **Restate-everything conclusion.**
   ❌ "In summary, as we've seen…"
   ✅ End on the one thing the reader should do or remember, not a recap.
8. **Fake-debunk framing.**
   ❌ "What most articles won't tell you is…"
   ✅ Just tell them the thing.
9. **Uniform rhythm (burstiness fix).**
   ❌ five sentences all 18–22 words.
   ✅ Vary deliberately. Short sentence. Then a longer, subordinate-clause-carrying sentence that develops the idea and earns its length.
10. **Spaced em-dash tic.**
    ❌ "The result — which surprised everyone — held."
    ✅ Use a comma, colon, period, or parentheses; reserve em-dashes and don't surround them with spaces.

## (c) Self-check

1. Search the draft for every Tier-1/Tier-2 word; justify or replace each.
2. Find every "not X, it's Y" / "not only… but also" — delete the rejected half.
3. Count hedges per paragraph; if >3, cut.
4. Is every factual claim attributed to a nameable source or number? If not, cut or specify.
5. Does the conclusion recap or advance? If recap, rewrite.
6. Read three consecutive sentences aloud — do their lengths differ noticeably? If not, vary them.
7. Count spaced em-dashes; convert most to commas/periods.
8. Would a knowledgeable colleague find one specific, checkable, non-obvious fact here? If not, the draft is slop.
