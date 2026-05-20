// ============================================
// Elemental Melee Animation Script
// ============================================
// Used when an elemental weapon group is acting as
// a melee weapon, or when a melee weapon needs an
// elemental overlay driven by damage type.
// ============================================

import { addAnimationSound, addElementalMeleeOverlay, applyMissEffect, getAnimationTarget } from '../helpers.js';

export default async function elementalMelee(seq, context) {
  const effect = seq.effect()
    .file('jb2a.melee_generic.slash.01.orange')
    .atLocation(context.sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(context.scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.4 });
  addElementalMeleeOverlay(seq, context, { scaleMultiplier: 0.85, opacity: 0.85 });
  addAnimationSound(seq, context, { delay: 50 });
}