---
name: vi-copywriting
description: "Write or rewrite Vietnamese marketing/editorial/UI copy — headlines, heroes, CTAs, membership value-props, brand voice, taglines, About/manifesto, event/landing pages. Bold but NO superlatives/superiority claims; Vietnamese-first for Vietnamese readers. Learned from a 104-page evidence corpus. Trigger: viết copy/nội dung tiếng Việt, viết lại headline/hero/CTA, marketing page copy, brand voice, tagline, slogan, giọng thương hiệu, microcopy tiếng Việt. NOT for code, NOT English-first copy; visual brand (color/type/layout) defers to the project's marketing-page-brand-voice memory."
---

# Vietnamese Copywriting

Operative rules for writing Vietnamese copy that is bold, warm, and credible **without hype**. Built from a 104-page corpus (VN editorial, hip-hop/battle-rap, persona brands, membership pages, + superlative-heavy controls). Heavy detail + cited evidence live in `references/`; load them when you need depth.

## Non-negotiables

1. **Vietnamese-first, for Vietnamese readers.** Headlines/sections/CTAs in Vietnamese. Keep only domain English terms that read native (rap, beat, flow, punchline, diss, battle, livestream, content, membership). Never ship English-first copy or literal machine-translation rhythm.
2. **No superlatives / no superiority claims.** Ban `…nhất`, `số 1`, `hàng đầu`, `duy nhất`, `tối ưu`, `tiên phong`, `đẳng cấp`, `100%`, `lớn nhất thế giới`, `nhất Việt Nam`, `top battler`, `nguyên bản nhất`. See `references/superlative-banlist.md`. Create energy other ways (§Energy).
3. **Diacritics are mandatory and complete.** Run the diacritic pass (below) on any output >a few lines — long generations drop tone marks.
4. **Visual brand is not my job.** Color/typography/ALL-CAPS/layout = the project memory `marketing-page-brand-voice.md` (HNHH editorial, yellow #ffea00, sharp corners). If prose and that memory conflict, the memory wins. This skill owns _words_.

## Step 1 — Pick the register (then keep it consistent)

Map the surface to one register; lock its pronoun pair + tone-particle level for the whole piece. Full table + examples: `references/register-cheatsheet.md`.

| Surface                                  | Register                       | Brand→Reader pronouns                                   | Tone particles                 |
| ---------------------------------------- | ------------------------------ | ------------------------------------------------------- | ------------------------------ |
| VRL / Barfight / battle recap            | **Combative/arena**            | `chúng tôi`/none → named; `tao/mày` only in quoted bars | almost none                    |
| Barcade / social / light marketing       | **Playful/character**          | `tụi mình/mình` → `bạn`                                 | free (`nhé, nha, luôn, á, ta`) |
| Punch Class / community / membership     | **Conversational/warm-friend** | `mình/tụi mình/chúng mình` → `bạn/các bạn`              | moderate (`nhé, nha, luôn`)    |
| News / Battle Book / articles            | **Neutral/editorial**          | 3rd-person; `chúng ta` for culture-talk                 | rare                           |
| Payments / policy / official VRL notices | **Formal/institutional**       | `chúng tôi` → `bạn`/`quý độc giả`                       | none                           |

**Belonging engine** (manifestos/rallying): open `chúng tôi` (brand) → pivot to `chúng ta` (we, together) → close on `bạn`. This `chúng ta` pivot is the strongest belonging move in the corpus.

## Step 2 — Create energy WITHOUT superlatives

The corpus's core lesson. Reach for these instead of "best/biggest/#1":

- **Behavioral claim** over label: "Không ai làm như…" (does the work of "unique", with proof).
- **Receipts / scale-by-number**: "qua N mùa", "X battler đã tranh tài", "được chọn từ 68". Numbers beat adjectives.
- **Time-as-proof**: "sau 15 năm", "qua nhiều mùa" → authority without "lớn nhất".
- **From→to arc**: "Từ [trước] đến [sau]" — comparatives (`hơn`), not superlatives (`nhất`).
- **Metaphor for intensity**: "địa chấn", "cú nổ", "cuộc chiến", "võ đài".
- **Vulnerability / confession** (editorial/creator): intimacy via `mình`, admitted flaws.
- **Dare the reader**: "...vấn đề là bạn có dám… hay không."
- **Hedge + back any ranking you can't avoid**: "một trong những… tính đến lúc này" + a number.
- **Delete the claim, keep the proof** — if a superlative sits next to real evidence (the bucket-E pattern), cut the claim; the evidence is stronger alone.

## Step 3 — Structure (templates)

Use the architecture for the page type (full list + cited section flows: `references/pattern-library.md` §5). Quick templates:

- **Hero**: `[căng/ẩn dụ + dấu hai chấm] + [chủ thể + số liệu mồi + động từ mạnh]` or VS-framing for events ("Trận chính: [A] đối đầu [B]. Không ai chịu nhường ai."). Keep tight (~8–45 words headline+subhead).
- **Membership/join**: hero (belonging promise) → why-join (pain/mission) → benefits ladder ending on belonging → tiers → social proof → **price-reframe** ("Chỉ từ … , rẻ hơn …") → CTA. Low-pressure; curiosity/belonging over false scarcity.
- **Manifesto/About**: mission line (chiasmus/tricolon) → refusal/origin narrative → values → `chúng ta` pivot → invitation.
- **Event/tournament**: VS-framing hero → lineup → stakes/continuity hook ("trở lại sau trận để đời với…") → access promise ("Xem mọi lúc, mọi nơi.") → CTA.
- **Tricolon** is the workhorse unit: three concrete beats → one flat verdict.
- **CTA verbs**: `Đăng ký · Tham gia · Trở thành thành viên · Gia nhập · Xem thêm · Nhận · Đặt lịch`.

Swipe file of verbatim lines by use-case: `references/swipe-file.md`.

## Step 4 — Voice devices (use sparingly, never all at once)

Rhetoric that recurs in good VN copy: tricolon · antithesis ("Dịu dàng để chữa lành và Quyết liệt để phản kháng") · concession→hard-claim ("…nhưng 'chán' thì tuyệt nhiên không") · anaphora ("Có người… Có người…") · oxymoron header ("Hỗn loạn có hệ thống") · suspense ellipsis · deadpan closer ("…chấm hết."). Hip-hop register + persona-voice techniques (mascot worldbuilding, objection-first concession, humble-brag wink): `references/pattern-library.md` §8–9. **Persona caution:** extract the _principle_ (commit to a character, name the objection, stay in voice everywhere) — never clone a single brand's gimmick.

## Step 5 — Enforcement passes (run before declaring done)

1. **No-superlative pass.** Scan against `references/superlative-banlist.md` (`nhất\b | số\s*1 | hàng đầu | duy nhất | tối ưu | tiên phong | đẳng cấp | 100% | bậc nhất | vượt trội | hoàn hảo`). Any hit → rewrite using a Step-2 substitute. Exception: `…nhất` inside a quoted source/bar, or a hedged+backed ranking.
2. **Diacritic proofread pass.** Re-read every Vietnamese line; ensure complete tone marks (no bare-ASCII Vietnamese like "Viet Nam", "dang ky", "cong dong"). Long outputs are where marks drop — check the tail.
3. **Register-fit pass.** Pronoun pair + tone-particle level consistent with the Step-1 register? No `nhé` on a combative VRL line; no `tao/mày` outside quotes; no slang in formal/payment copy.
4. **VN-first pass.** Headlines/CTAs Vietnamese? Only native-reading English terms kept? No literal-MT rhythm?

## References (load on demand)

- `references/pattern-library.md` — full ranked, cited pattern library (the evidence).
- `references/register-cheatsheet.md` — the 5 registers, pronoun system, tone particles.
- `references/swipe-file.md` — verbatim VN lines by use-case.
- `references/superlative-banlist.md` — ban list + approved substitutions.
- `references/corpus-index.md` — what was scraped, where the evidence lives, how to regenerate.
- Project brand (visual, authoritative): `marketing-page-brand-voice.md` memory.
