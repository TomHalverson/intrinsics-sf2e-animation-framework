// ============================================
// Disintegrator Beam Animation Script
// ============================================
// Used for the "disintegrator" weapon group in SF2E.
// ============================================

export default async function disintegrator(seq, { sourceToken, targetToken, isHit, scale, speed }) {
  const effect = seq.effect()
    .file('jb2a.disintegrate.green')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.5).missed();
  }
}
