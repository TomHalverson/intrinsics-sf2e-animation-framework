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

export default async function laser(seq, { sourceToken, targetToken, isHit, scale, speed }) {
  const effect = seq.effect()
    .file('jb2a.lasershot.red')
    .atLocation(sourceToken)
    .stretchTo(targetToken)
    .scale(scale)
    .zIndex(10);

  if (!isHit) {
    effect.opacity(0.5).missed();
  }
}
