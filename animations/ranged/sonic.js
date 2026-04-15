// ============================================
// Sonic Wave Animation Script
// ============================================
// Used for the "sonic" weapon group in SF2E.
// ============================================

export default async function sonic(seq, { sourceToken, targetToken, isHit, scale, speed }) {
  const effect = seq.effect()
    .file('jb2a.thunderwave.center.blue')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.4).missed();
  }
}
