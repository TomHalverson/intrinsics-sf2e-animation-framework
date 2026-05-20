// ============================================
// Laser Beam Animation Script
// ============================================
// Fires a beam effect from source to target.
// Used for the "laser" weapon group in SF2E.
//
// Context properties:
//   sourceToken  — the attacking token
//   targetToken  — the target token
//   isHit        — boolean, did the attack hit?
//   scale        — final scale (includes global multiplier)
//   speed        — final speed in ms
//   attackMode   — 'ranged' or 'melee'
//   weaponInfo   — full weapon metadata object
//   soundVolume  — 0.0 to 1.0
//   soundEnabled — boolean
// ============================================

import { addAnimationSound, applyMissEffect, getAnimationTarget } from '../helpers.js';

export default async function laser(seq, context) {
  const { sourceToken, scale } = context;
  const effect = seq.effect()
    .file('jb2a.lasershot.red')
    .atLocation(sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale(scale)
    .zIndex(10);

  applyMissEffect(effect, context, { opacity: 0.5, randomRotation: false });
  addAnimationSound(seq, context);
}
