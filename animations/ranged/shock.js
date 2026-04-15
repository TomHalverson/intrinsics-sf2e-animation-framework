// ============================================
// Shock / Electricity Animation Script
// ============================================
// Used for the "shock" weapon group in SF2E.
// ============================================

export default async function shock(seq, { sourceToken, targetToken, isHit, scale, speed }) {
  const effect = seq.effect()
    .file('jb2a.chain_lightning.primary.blue')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.4).missed();
  }
}
