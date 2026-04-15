// ============================================
// Thrust / Pierce Animation Script
// ============================================
// Used for "polearm", "spear", and "pick"
// weapon groups. A forward thrusting motion.
// ============================================

export default async function thrust(seq, { sourceToken, targetToken, isHit, scale }) {
  const effect = seq.effect()
    .file('jb2a.melee_attack.01.trail.04.blue')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.4).randomRotation();
  }
}
