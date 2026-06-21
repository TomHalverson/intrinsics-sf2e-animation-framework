// ============================================
// Slash Animation Script
// ============================================
// Used for "sword", "axe", and "knife" weapon groups.
// A horizontal/diagonal slashing motion.
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

export default async function slash(seq, context) {
  const { sourceToken, scale } = context;

  if (addFumbleEffect(seq, context, { scaleMultiplier: 0.8 })) {
    addAnimationSound(seq, context, { delay: 50 });
    return;
  }

  const effect = seq.effect()
    .file('jb2a.melee_generic.slash.01.orange')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.4 });
  applyCriticalScale(effect, context, { multiplier: 1.3 });
  addElementalMeleeOverlay(seq, context);
  addCriticalBurst(seq, context, { delay: 60, scaleMultiplier: 1.2 });
  addTargetReaction(seq, context, { delay: 70 });
  addAnimationSound(seq, context, { delay: 50 });
}
