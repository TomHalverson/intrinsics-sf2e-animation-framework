// ============================================
// Plasma Bolt Animation Script
// ============================================
// Used for the "plasma" weapon group in SF2E.
// ============================================

export default async function plasma(seq, { sourceToken, targetToken, isHit, scale, speed }) {
  const effect = seq.effect()
    .file('jb2a.ranged.04.projectile.01.blue')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.5).missed();
  }
}
