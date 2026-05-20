// ============================================
// Plasma Bolt Animation Script
// ============================================
// Used for the "plasma" weapon group in SF2E.
// ============================================

import { addAnimationSound, applyMissEffect, getAnimationTarget } from '../helpers.js';

export default async function plasma(seq, context) {
  const { sourceToken, scale } = context;
  const effect = seq.effect()
    .file('jb2a.ranged.04.projectile.01.blue')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.5, randomRotation: false });
  addAnimationSound(seq, context);
}
