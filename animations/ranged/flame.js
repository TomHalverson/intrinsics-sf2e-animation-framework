// ============================================
// Flame / Fire Animation Script
// ============================================
// Used for the "flame" weapon group in SF2E.
// ============================================

import { addAnimationSound, applyMissEffect, getAnimationTarget } from '../helpers.js';

export default async function flame(seq, context) {
  const { sourceToken, scale } = context;
  const effect = seq.effect()
    .file('jb2a.fire_bolt.orange')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.4, randomRotation: false });
  addAnimationSound(seq, context);
}
