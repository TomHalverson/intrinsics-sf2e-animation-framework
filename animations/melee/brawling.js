// ============================================
// Brawling / Unarmed Animation Script
// ============================================
// Used for the "brawling" weapon group and
// "unarmed" weapon category in SF2E.
// ============================================

export default async function brawling(seq, { sourceToken, targetToken, isHit, scale }) {
  const effect = seq.effect()
    .file('jb2a.unarmed_strike.physical.01.blue')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.4).randomRotation();
  }
}
