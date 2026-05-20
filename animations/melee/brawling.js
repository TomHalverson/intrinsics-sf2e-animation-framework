// ============================================
// Brawling / Unarmed Animation Script
// ============================================
// Used for the "brawling" weapon group and
// "unarmed" weapon category in SF2E.
// ============================================

import { addAnimationSound, addElementalMeleeOverlay, applyMissEffect, getAnimationTarget } from '../helpers.js';

export default async function brawling(seq, context) {
  const { sourceToken, scale } = context;
  const effect = seq.effect()
    .file('jb2a.unarmed_strike.physical.01.blue')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.4 });
  addElementalMeleeOverlay(seq, context, { scaleMultiplier: 0.6, opacity: 0.65 });
  addAnimationSound(seq, context, { delay: 30, volumeMultiplier: 0.9 });
}
