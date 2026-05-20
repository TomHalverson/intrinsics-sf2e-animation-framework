// ============================================
// Shock / Electricity Animation Script
// ============================================
// Used for the "shock" weapon group in SF2E.
// ============================================

import { addAnimationSound, applyMissEffect, getAnimationTarget } from '../helpers.js';

export default async function shock(seq, context) {
  const { sourceToken, scale } = context;
  const effect = seq.effect()
    .file('jb2a.chain_lightning.primary.blue')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.4, randomRotation: false });
  addAnimationSound(seq, context);
}
