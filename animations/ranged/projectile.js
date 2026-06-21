// ============================================
// Projectile (Bullet) Animation Script
// ============================================
// Used for "projectile", "firearm", "bow",
// "crossbow", "dart", and "sling" weapon groups.
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

export default async function projectile(seq, context) {
  const { sourceToken, scale, variant } = context;

  if (addFumbleEffect(seq, context)) {
    addAnimationSound(seq, context);
    return;
  }

  addMuzzleFlash(seq, context);

  const effect = seq.effect()
    .file(variant?.projectile ?? 'jb2a.bullet.01.orange')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.5, randomRotation: false });
  applyCriticalScale(effect, context, { multiplier: 1.4 });
  addImpactEffect(seq, context);
  addCriticalBurst(seq, context);
  addTargetReaction(seq, context);
  addAnimationSound(seq, context);
}
