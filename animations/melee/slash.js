// ============================================
// Slash Animation Script
// ============================================
// Used for "sword", "axe", and "knife" weapon groups.
// A horizontal/diagonal slashing motion.
// ============================================

export default async function slash(seq, { sourceToken, targetToken, isHit, scale }) {
  const effect = seq.effect()
    .file('jb2a.melee_generic.slash.01.orange')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.4).randomRotation();
  }
}
