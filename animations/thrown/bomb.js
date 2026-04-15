// ============================================
// Bomb / Grenade Toss Animation Script
// ============================================
// Used for the "bomb" weapon group in SF2E.
// An arcing thrown projectile.
// ============================================

export default async function bomb(seq, { sourceToken, targetToken, isHit, scale, speed }) {
  const effect = seq.effect()
    .file('jb2a.throwable.throw.grenade.03.blackblue')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.5).missed();
  }
}
