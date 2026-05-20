// ============================================
// Disruption Pulse Animation Script
// ============================================
// Used for the "disruption" weapon group in SF2E.
// ============================================

import { addAnimationSound, applyMissEffect, getAnimationTarget } from '../helpers.js';

export default async function disruption(seq, context) {
  const { sourceToken, scale } = context;
  const effect = seq.effect()
    .file('jb2a.eldritch_blast.purple')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.5, randomRotation: false });
  addAnimationSound(seq, context);
}
