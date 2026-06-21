// ============================================
// Thrust / Pierce Animation Script
// ============================================
// Used for "polearm", "spear", and "pick"
// weapon groups. A forward thrusting motion.
// ============================================

import {
  addAnimationSound,
  addElementalMeleeOverlay,
  applyMissEffect,
  getAnimationTarget,
  applyCriticalScale,
  addCriticalBurst,
  addFumbleEffect,
  addTargetReaction
} from '../helpers.js';

export default async function thrust(seq, context) {
  const { sourceToken, scale } = context;

  if (addFumbleEffect(seq, context, { scaleMultiplier: 0.8 })) {
    addAnimationSound(seq, context, { delay: 40 });
    return;
  }

  const effect = seq.effect()
    .file('jb2a.melee_attack.01.trail.04.blue')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.4 });
  applyCriticalScale(effect, context, { multiplier: 1.3 });
  addElementalMeleeOverlay(seq, context, { scaleMultiplier: 0.65, opacity: 0.75 });
  addCriticalBurst(seq, context, { delay: 60, scaleMultiplier: 1.1 });
  addTargetReaction(seq, context, { delay: 60 });
  addAnimationSound(seq, context, { delay: 40 });
}
