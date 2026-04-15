// ============================================
// Projectile (Bullet) Animation Script
// ============================================
// Used for "projectile", "firearm", "bow",
// "crossbow", "dart", and "sling" weapon groups.
// ============================================

export default async function projectile(seq, { sourceToken, targetToken, isHit, scale, speed }) {
  const effect = seq.effect()
    .file('jb2a.bullet.01.orange')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.5).missed();
  }
}
