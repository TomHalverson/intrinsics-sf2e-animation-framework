// ============================================
// Flame / Fire Animation Script
// ============================================
// Used for the "flame" weapon group in SF2E.
// ============================================

import {
  addAnimationSound,
  applyMissEffect,
  getAnimationTarget,
  applyCriticalScale,
  addCriticalBurst,
  addFumbleEffect,
  addMuzzleFlash,
  addImpactEffect,
  addTargetReaction
} from '../helpers.js';

export default async function flame(seq, context) {
  const { sourceToken, scale, variant } = context;

  if (addFumbleEffect(seq, context)) {
    addAnimationSound(seq, context);
    return;
  }

  addMuzzleFlash(seq, context);

  const effect = seq.effect()
    .file(variant?.projectile ?? 'jb2a.fire_bolt.orange')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.4, randomRotation: false });
  applyCriticalScale(effect, context);
  addImpactEffect(seq, context, { file: 'jb2a.impact.011.orange' });
  addCriticalBurst(seq, context, { file: 'jb2a.impact.011.orange' });
  addTargetReaction(seq, context, { file: 'jb2a.impact.011.orange' });
  addAnimationSound(seq, context);
}
