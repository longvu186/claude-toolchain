# Direction, measured motion and the independent review loop (mined 2026-10-30)

Read this for any **brand-facing** film (launch, promo, feature, social ad, logo sting). It adds three things on top
of `motion-craft.md`:
- direction before build
- motion numbers measured from professional films
- a review loop where the builder never grades its own work.

Evidence: research `08-github-skill-mining.md`. The deep sources are vendored and pinned; read them only when a section
points there.

## 1. Brand files, once per business (charlie947 brand-intake, MIT)

Every business HQ makes videos for gets two files under `data/documents/<module>/video/`:

- **`brand.md`** (≤ 300 words) covers:
  - name and one-line offer
  - audience
  - what we promote, with the real link
  - the feeling (≤ 3 of calm, premium, playful, urgent, technical, warm, bold)
  - assets: hex colours, fonts, logo files
  - the "never" list
- **`MOTION.md`**, written from 3–5 reference frames the operator likes, covers:
  - every hex and what it is for
  - fonts and sizes
  - timing in, hold and out
  - easing and frame clock
  - texture
  - **5 things this brand's motion must never do**
  - one shot-by-shot example done right

  Where the frames can't tell you, write `ASK ME`, never a guess.
- Typed hex codes beat sampled ones (JPEG sampling drifts a few points).
- Mixed reference frames give mixed looks: pick one master look, or map each look to a job.
- Add the line **"The file sets the look, not the ambition."** Without it, output gets timid.

Start every video by reading both files. If they don't exist, run the intake first (batch 1: name, audience, offer,
feeling; batch 2: colours/fonts/logo, references, one never). Vendored: `vendor/charlie947-brand@*/brand-intake/`.

## 2. Direction before build

1. **Real material first.**
   - Capture the product: screenshots at 2×, the logo file (never redrawn), colours and fonts from its CSS, real
     copy and real data.
   - Cover the logo and ask: would this film still work for a competitor? If yes, the idea is generic.
   - Mask private data in captures.
2. **Write the one true thing.** In four lines: Problem, Audience, Goal, Emotion. Then name the one real feature or
   moment the film is for.
3. **Three directions that differ in kind**, not just colour. Examples of kinds:
   - a UI documentary of one task
   - a held shot
   - a typographic essay
   - a real-output montage
   - a joke with a character
   - stillness that breaks

   Make **one real key frame per direction** (`render-frames.mjs --from N --to N`) plus a palette card. A transformation
   chain is the most over-used kind. For anything client-facing, the operator picks; rework after a full build costs
   about 10×.
4. **Beat sheet where every beat "buys" one belief:** "Buys: the viewer ___." If you can't fill that in, cut the beat.
   - Roles: hook, turn, proof, CTA. Proof is the largest share.
   - At most 25 % of beats are "the point".
   - Show it, then say it: a claim in type is followed by a hard cut to the product doing it.
   - Pick the screenshot-worthy hero moment and **build it first**, at full resolution, before anything else.
5. **One system per film:**
   - one frame clock
   - one blur grammar
   - the brand's type
   - **one accent with one meaning** (≤ ~8 % of pixels, floods the frame at most once)
   - an optional carried object that travels across every seam and is never pinned in place

## 3. Never ship (strip these; don't justify them)

Synthesised from motionmaxxing's user-rejection list and cinetic's hard bans. The brand's own identity overrides any
item, e.g. if their wordmark is a serif.

- **Page chrome:**
  - a brand name in a corner
  - tracked-caps labels
  - counters like "02 / SPEAK"
  - timecodes or BPM text
  - progress bars
  - corner brackets
  - a kicker or eyebrow above a headline
- **Deck layouts:** a left headline block with media on the right; title-then-content; header/body/footer.
- **Fake UI:**
  - rounded "label · $value" cards
  - "Good morning" cards
  - skeleton bars
  - zinc greys
  - invented names or numbers where a real capture exists
- **Invented stats.** No stat walls, no centred-big-number slides.
- **Slogan copy:** one-word triplets, "Not just X. It's Y.", "Unlock…", "Meet X", "Introducing", "the future of".
- **The name's first association** (a rocket for "launch", stars for "star").
- **AI decoration:** sparkles for "AI", confetti, lens flares, code rain, neon glow, purple-blue gradients.
- **A small card on a void, or a flat swatch background per scene.** A ground is a surface (light, depth, texture).
- **A web-footer ending** (logo + tagline + button + URL) held past **1.4 s**.
- **Self-certification.** A 15 s black render was once certified "VERIFIED / CLEAN". Quote script numbers or it
  didn't happen.

## 4. Measured motion (motionmaxxing: 4,288 moves from 50 professional moments; full tables in `vendor/motionmaxxing@*/references/motion.md`)

| Thing | Measured default |
|---|---|
| Move duration | median **10 f @30 (0.33 s)**. Translate/scale entries 12 f, opacity 6 f, blur 7 f, exits 13–14 f. A film built on 20–30 f ease-outs is slower than every pro sample |
| Landing vs leaving | landings ease **out** (58 %); exits **accelerate** (ease-in 37 %, scale exits 42 %, blur-outs 63 %) and end at peak speed on the cut |
| How things arrive | by **moving** (transform 71 %, hard cut 16 %, opacity-only 12 %). Opacity is a 4–6 f helper (0.12–0.3 → 1), not the arrival |
| Stagger | siblings 1–3 f apart, **uneven** gaps; each move ~2× the gap so tails overlap. Whole words 2–5 f apart (8–12 f voice-led). CTA groups slow to ~8 f |
| Overshoot | on < 9 % of moves, **late** (peak ~t 0.7) and small (≈ 1.08). **At most one visible spring per film** |
| Arrival scale | arrive by decelerating from **oversize** (logo from ~3.5×, cursor 2–5×), never grow from zero |
| Holds | no dead frame: a hold > 3 f keeps one living thing (1–3 px/f drift, 0.5–1 % scale creep, caret). A designed breath of 0.6–1.5 s before a payoff is good |
| Cuts | land mid-move; scenes start already moving; cuts every 0.3–2.3 s |
| Endings | end hold 0.6–1.4 s; final shot ≤ 25 % of the film |
| CTA beat | the most staccato beat: entries ~6 f, 23 % snapSettle, no overshoot |
| Whole-film motion | mean frame-to-frame luma change, human films median **6.8 (IQR 4.4–9.8)**; `look.py` prints yours |

The 12 measured eases (cruise, glide, softInOut, softLand, gentleIn, snapSettle, whip, accelExit, crashOut, popOver,
crashIn, bounceHard) with their %-done-at-10/25/50/75 points are in `motion.md` §2. Port the ones you need into
`templates/lib/motion.js` as pure functions.

## 5. Seams: the default scene boundary is a velocity-matched cut, not a crossfade (HyperFrames `cut-the-curve`)

- **Cut the curve (default).** The outgoing hero moves ~12 % of frame width (≈ 230 px at 1920) with `power4.in`; the
  incoming one continues in the same direction with `power4.out`. Same distance and duration on both sides, so the
  velocity matches at the cut. Total ≈ 0.6 s.
  - The exit opacity finishes at 25–30 % of its travel; the entry ignites at 0.35 opacity mid-path.
- **Zoom-through.** Exit scale 1 → 1.2 with blur 0 → 10 px over 0.2 s (`power3.in`, with opacity on its own linear
  tween). Hard swap. Entry 0.75 → 1 over 0.5 s (`expo.out`). Headlines only.
- **Inverse zoom.** Only for payoff beats: the incoming element arrives at 1.25 and retracts.
- **Rack-focus blur-cut.** At most once per ~8 s. Swap at peak blur (8–12 px) with ~1.06 lens breathing.
- **Paint the stage.** Any seam where the summed opacity dips below 1 shows the page behind it. An unpainted root
  flashes white.
- Full catalogue and waterfall entries: `vendor/hyperframes-doctrine@*/cut-the-curve/`. Render-correctness
  prerequisites: `seam-craft/`.

## 6. The demo cursor (HyperFrames `oversized-cursor` + motionmaxxing ui-demo)

- Size: ≈ 7 % of container width (≈ 134 px at 1920). An actual-size cursor vanishes at video scale.
- It **enters from off-screen** in one decelerating glide (0.4–0.9 s, `power3.out`). Never fade it in at rest.
- It parks before it acts. The press squashes 2–3 f and the target answers one frame later. Cut before the release.
- Every click causes the next thing; time the click to the word that names it.
- Use a brand cursor (e.g. a multiplayer arrow with a name tag) only when viewers would recognise it.
- If you have the repo, **rebuild the screens from source** as static components on a fixed canvas, with every click
  a frame constant (digitalsamba synthetic-ui-demo). It re-renders identically and needs no seeded account. Read the
  default branch from the remote, because local checkouts go stale. Otherwise capture per `product-demo.md`.

## 7. Chromium rendering traps (all engines render through Chromium; full table in `vendor/cinetic@*/references/chromium-rendering.md`)

| Symptom | Fix |
|---|---|
| Slow drift moves in 1 px stairs, text shimmers | Put all translation in **one transform matrix**, never `left`/`top` plus a transform |
| Text settles in 1 px ticks vertically | Headless snaps text layers' **vertical** position to whole pixels. End vertical text moves on an eased arrival, not a slow creep |
| Defocus snaps sharp → soft in one frame | Animated `filter: blur()` on big layers steps. Cross-fade a sharp copy with a constant-blur copy |
| A ghost copy flashes on random frames | `will-change` on a subtree with animated blur. Remove it |
| A shape freezes after an overshoot | Negative SVG `r`/`rx`/`width` is rejected. Clamp to ≥ 0 |
| Soft text under `perspective` | 3D layers rasterise at a capped scale. Lay out at shot scale with CSS `zoom` and divide the camera scale |
| Rings in gradients and vignettes | 8-bit CSS gradients band. Use dithered PNG backdrops (`vendor/cinetic@*/scripts/dither-gradient.py`) or grain |
| Fallback font on early frames | Gate frame 0 on `document.fonts` (already in our contract) |

## 8. The review loop (the builder never grades itself)

1. **Draft render at half resolution**, then measure:
   - `bash scripts/qa.sh all draft.mp4 <cuts>` (sheet, seams, probe, loudness, defects)
   - `python3 -I vendor/motionmaxxing@*/scripts/look.py draft.mp4 --out qa/look --expect <s> [--expect-audio]`.
     Gates: G0 exists and has the right length, G2 no run of more than 3 flat frames, G3 end hold ≤ 1.4 s and final
     shot ≤ 25 %. Stdlib only.
   - `$P -I vendor/cinetic@*/scripts/forensics.py draft.mp4 --cuts <s,…> --json qa/forensics.json`. It checks
     one-frame pops, stalls, dead holds, ghost frames, judder, sharpness steps, banding and seam pops. **Declare
     designed cuts and colour-flood swaps** with `--cuts`/`--freeze-ok`, or they fail as pops. On our 09-28 reel it
     flagged the designed background swaps.
   - `node vendor/motionmaxxing@*/scripts/lint.mjs index.html` (G5, no page chrome; HTML compositions).
2. **Describe every contact-sheet frame in one sentence** (what's on screen, what's the hero, would it pass as a slide)
   *before* judging it.
3. **Independent critics.** Use fresh subagents that see only the render sheets, the brief and the references, never
   the code first. They return
   `{issues:[{priority, frame, problem, fix}], score}`. Lenses:
   - director: the weakest 3 s, the 2 s hook, does it read muted, the ending
   - forensics: reads the script JSON and inspects flagged frames at 1:1
   - sound/sync
   - round 1 only: art/copy/UI truth

   Critic prompts are in `vendor/cinetic@*/assets/critics/`. Then a **verifier** pass tries to refute each P0/P1 and
   drops anything wrong, invisible at speed, or whose fix would hurt.
4. **Fix in order:** broken or untrue → the idea → beat connections → hierarchy and scale → timing → finish → sound.
5. **Ship gate:**
   - no open P0
   - every script passes (or has a stated, designed exception)
   - **≤ 5 rounds**: then stop and say plainly what you'd still change

   For a one-line ask with no reviewer, give yourself the three notes a demanding director would give, and fix them
   before the first showing.
6. **NOTE.md ships with the film:**
   - the idea and why
   - what each beat buys
   - what is real vs illustrative or generated
   - the quoted gate numbers
   - what you'd still improve

   Describe what you checked; never certify the film as good.

## 9. Taste ledger (gets better per operator)

After every film, append the operator's reactions **in their words** to `data/documents/<module>/video/taste.md`:
- what they rejected
- before/after fixes
- which direction they picked and why

Keep three kinds of entry, never mixed:
- `preference`: quoted, holds until they change it
- `observed`: one film
- `verified`: seen in 2+ films

Read it before the next film. If a check could catch a recurring note, add the check instead of the note
(huashu-motion's harvest loop).

## 10. Copying a reference ("make it move like this")

Use frame-level dissection, not eyeballing. Viewing at 1× lies about easing, stagger order and overlap.
1. Acquire the reference. Then probe its fps.
2. Overview sheet: `ffmpeg -i ref.mp4 -vf "fps=2,scale=270:-1,tile=7x5" overview.png`.
3. Crop-band frame stacks of just the moving region at native fps.
4. Measure positions, scales and onset frames per element into a table, and fit each curve to the nearest measured
   ease (§4).
5. Port and render, then compare side by side at the same frames until the deltas are within 1–2 f.

Learn the mechanics; never ship another brand's assets, copy or layout.

## 11. Style menu (when the brief says "make it look like X")

`vendor/lemo-opuscar-styles@*/` has 66 style prompts. Examples: risograph, ukiyoe, watercolor, swiss-motion,
blueprint, newsreel, papercut-red, pixel-rpg, whiteboard, transit-map, satellite-briefing, teardown, dark-keynote.

Each covers:
- its essence and what it is *not*
- the materials and rendering pipeline
- colour logic
- type
- motion quality (e.g. on twos vs ones)
- camera grammar

Licence: MIT code, CC BY 4.0 text. **Credit "Lemo-Opuscar" in the delivery manifest when a style prompt shapes a
film.** Use one register per film (`brief-patterns.md`).
