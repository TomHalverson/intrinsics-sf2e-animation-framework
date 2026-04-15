// ============================================
// Flame / Fire Animation Script
// ============================================
// Used for the "flame" weapon group in SF2E.
// ============================================

export default async function flame(seq, { sourceToken, targetToken, isHit, scale, speed }) {
  const effect = seq.effect()
    .file('jb2a.fire_bolt.orange')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.4).missed();
  }
}
