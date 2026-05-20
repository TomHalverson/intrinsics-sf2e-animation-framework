// ============================================
// Thrust / Pierce Animation Script
// ============================================
// Used for "polearm", "spear", and "pick"
// weapon groups. A forward thrusting motion.
// ============================================

import { addAnimationSound, addElementalMeleeOverlay, applyMissEffect, getAnimationTarget } from '../helpers.js';

export default async function thrust(seq, context) {
  const { sourceToken, scale } = context;
  const effect = seq.effect()
    .file('jb2a.melee_attack.01.trail.04.blue')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.4 });
  addElementalMeleeOverlay(seq, context, { scaleMultiplier: 0.65, opacity: 0.75 });
  addAnimationSound(seq, context, { delay: 40 });
}
