// ============================================
// Cryo / Cold Animation Script
// ============================================
// Used for the "cryo" weapon group in SF2E.
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

export default async function cryo(seq, context) {
  const { sourceToken, scale, variant } = context;

  if (addFumbleEffect(seq, context)) {
    addAnimationSound(seq, context);
    return;
  }

  addMuzzleFlash(seq, context);

  const effect = seq.effect()
    .file(variant?.projectile ?? 'jb2a.ray_of_frost.blue')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.5, randomRotation: false });
  applyCriticalScale(effect, context);
  addImpactEffect(seq, context, { file: 'jb2a.impact.blue.0' });
  addCriticalBurst(seq, context, { file: 'jb2a.impact.blue.0' });
  addTargetReaction(seq, context, { file: 'jb2a.impact.blue.0' });
  addAnimationSound(seq, context);
}
