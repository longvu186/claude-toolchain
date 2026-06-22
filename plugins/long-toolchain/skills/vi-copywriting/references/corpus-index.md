# Corpus index — evidence basis for this skill

This skill is **learned from evidence**, not priors. Patterns trace to a corpus of **104 clean page captures** scraped 2026-06-22.

## Coverage (104 captures, all bucket floors met)

| Bucket | Theme                                                                                                                                    | Captures | Role                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------- |
| A      | Vietnamese editorial/media (Vietcetera, Kenh14, Spiderum, VnExpress, Tien Phong)                                                         | 27       | VN register / diacritic source of truth |
| B      | Hip-hop / battle-rap — VN (GERDNANG, DirtyCoins, Rap Việt/KOR coverage) + intl (URLtv, HotNewHipHop, Complex, KOTD, Pitchfork, HipHopDX) | 27       | domain voice + energy                   |
| C      | Persona/character brands — VN (MoMo, Cocoon, TocoToco, Highlands, Pizza 4P's...) + intl (Duolingo, Liquid Death, Oatly, innocent, CAH)   | 26       | voice-as-character                      |
| D      | VN community/membership (Spiderum, VietNamNet Premium, Substack/Patreon/Ko-fi creators, course communities)                              | 14       | membership value-prop                   |
| E      | Superlative-heavy controls (edtech, thẩm mỹ, agency/SaaS)                                                                                | 10       | negative examples → ban list            |

## Where the evidence lives

- Raw captures (gitignored, regenerable): `thepenlab.vn/docs/ai/.analysis/vi-copywriting-corpus/raw/<ID>-<slug>.md` (+ `.meta.json` with url, fetched_at, content_sha256).
- Per-page structured extractions (gitignored): `.../extractions/<ID>.json`.
- Machine tallies: `.../synthesis/aggregate.json` (258 snippets, 80 EN→VN renderings, 104 energy-without-superlative notes; 0 parse errors).
- Canonical pattern library: `.../synthesis/pattern-library.md` (mirror of this skill's `references/pattern-library.md`).
- Source plan + failures: `.../index/source-plan.md`, `.../index/failures.jsonl` (24 failures logged — blocked SPAs, paywalls, 404s; no failure clustering).

## Integrity notes

- Every cited `[ID]` in the library resolves to a raw capture whose `content_sha256` is recorded in its `.meta.json`.
- Non-VN sources (intl B, intl C) contribute _technique only_; their snippets appear with a `vi:` rendering. No English phrasing is promoted to usable copy.
- Single-brand gimmicks are flagged "do-not-clone" in the library; only cross-source (≥2) transferable patterns are operative rules.

## Regenerating

Re-run the scrape via `scratchpad/crawl-to-file.ps1` (forces Python UTF-8 — required for Vietnamese, else cp1252 stdout crashes), re-aggregate with the corpus `aggregate.py`, re-synthesize. See `source-plan.md` for buckets/seeds.
