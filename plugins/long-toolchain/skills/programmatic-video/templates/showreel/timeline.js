// Shared beat map — consumed by the canvas renderer (browser) and the synth (node),
// so every cut, hit, and letter lands on the same sample.
const TL = {
  W: 1920, H: 1080, FPS: 60, DUR: 5, BPM: 120,
  // scene boundaries (seconds)
  IGNITE: 0.0, BURST: 0.5, WAVE: 1.5, MORPH: 2.5, TUNNEL: 3.5, FINAL: 4.25, CLOSE: 4.72,
  // accent hits (camera shake + chromatic split + impact audio)
  HITS: [0.5, 1.5, 2.5, 2.75, 3.0, 3.25, 3.5, 4.25],
  BIG_HITS: [0.5, 3.5, 4.25],
  MOTION_T0: 0.56, MOTION_STAGGER: 0.065, // "MOTION" per-letter entrances
  WAVE_WORDS: [[1.5, 'TIMING'], [1.75, 'RHYTHM'], [2.0, 'PHYSICS'], [2.25, 'FLOW']],
  MORPH_BEATS: [2.75, 3.0, 3.25], // circle → triangle → square → star
  TUNNEL_WORDS: [[3.5, 'EVERY'], [3.75, 'FRAME'], [4.0, 'MATTERS.']],
  SUBTITLE: 'MOTION DESIGN / SHOWREEL 2026',
  SUB_T0: 4.25 + 0.14, SUB_T1: 4.25 + 0.42,
};
if (typeof module !== 'undefined') module.exports = TL;
