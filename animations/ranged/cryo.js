// ============================================
// Cryo / Cold Animation Script
// ============================================
// Used for the "cryo" weapon group in SF2E.
// ============================================

export default async function cryo(seq, { sourceToken, targetToken, isHit, scale, speed }) {
  const effect = seq.effect()
    .file('jb2a.ray_of_frost.blue')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.5).missed();
  }
}
