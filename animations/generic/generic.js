// ============================================
// Generic Energy Bolt Animation Script
// ============================================
// Fallback animation for weapons with no
// specific weapon group or category match.
// ============================================

export default async function generic(seq, { sourceToken, targetToken, isHit, scale, speed }) {
  const effect = seq.effect()
    .file('jb2a.magic_missile.purple')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.5).missed();
  }
}
