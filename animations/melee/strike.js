// ============================================
// Strike / Bludgeon Animation Script
// ============================================
// Used for "club", "hammer", "flail", and "shield"
// weapon groups. A downward/impact striking motion.
// ============================================

export default async function strike(seq, { sourceToken, targetToken, isHit, scale }) {
  const effect = seq.effect()
    .file('jb2a.melee_generic.slash.02.orange')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.4).randomRotation();
  }
}
