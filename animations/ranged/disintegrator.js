// ============================================
// Disintegrator Beam Animation Script
// ============================================
// Used for the "disintegrator" weapon group in SF2E.
// ============================================

import { addAnimationSound, applyMissEffect, getAnimationTarget } from '../helpers.js';

export default async function disintegrator(seq, context) {
  const { sourceToken, scale } = context;
  const effect = seq.effect()
    .file('jb2a.disintegrate.green')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.5, randomRotation: false });
  addAnimationSound(seq, context);
}
