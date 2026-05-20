// ============================================
// Bomb / Grenade Toss Animation Script
// ============================================
// Used for the "bomb" weapon group in SF2E.
// An arcing thrown projectile.
// ============================================

import { addAnimationSound, applyMissEffect, getAnimationTarget } from '../helpers.js';

export default async function bomb(seq, context) {
  const { sourceToken, scale } = context;
  const effect = seq.effect()
    .file('jb2a.throwable.throw.grenade.03.blackblue')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.5, randomRotation: false });
  addAnimationSound(seq, context, { delay: 80 });
}
