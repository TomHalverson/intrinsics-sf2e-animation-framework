// ============================================
// Strike / Bludgeon Animation Script
// ============================================
// Used for "club", "hammer", "flail", and "shield"
// weapon groups. A downward/impact striking motion.
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

export default async function strike(seq, context) {
  const { sourceToken, scale } = context;

  if (addFumbleEffect(seq, context, { scaleMultiplier: 0.8 })) {
    addAnimationSound(seq, context, { delay: 70 });
    return;
  }

  const effect = seq.effect()
    .file('jb2a.melee_generic.slash.02.orange')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.4 });
  applyCriticalScale(effect, context, { multiplier: 1.3 });
  addElementalMeleeOverlay(seq, context, { scaleMultiplier: 0.7, opacity: 0.7 });
  addCriticalBurst(seq, context, { delay: 80, scaleMultiplier: 1.2 });
  addTargetReaction(seq, context, { delay: 90 });
  addAnimationSound(seq, context, { delay: 70 });
}
