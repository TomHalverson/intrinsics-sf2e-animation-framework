// ============================================
// Disruption Pulse Animation Script
// ============================================
// Used for the "disruption" weapon group in SF2E.
// ============================================

export default async function disruption(seq, { sourceToken, targetToken, isHit, scale, speed }) {
  const effect = seq.effect()
    .file('jb2a.eldritch_blast.purple')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.5).missed();
  }
}
