// ============================================
// Intrinsics SF2E Animation Framework
// Variant Registry
// ============================================
//
// Defines named visual variants per weapon
// signal: base item slug, trait, group, category,
// and damage type. The resolver walks these in
// specificity order and the first non-empty pool
// wins.
//
// Each variant entry:
//   id          — stable string (persisted to item flag)
//   label       — display string for UI
//   projectile  — Sequencer file path for the main effect
//   muzzle      — (optional) source-side muzzle flash
//   impact      — (optional) target-side hit effect
//   sound       — (optional) sound file
//   tint        — (optional) CSS-style hex; for UI dots / future tinting
// ============================================

/**
 * Variants pinned to a specific weapon `system.baseItem` slug.
 * Highest specificity — overrides group/trait fallbacks entirely.
 */
export const BASE_VARIANTS = {
  'laser-pistol': [
    { id: 'red',    label: 'Red',    projectile: 'jb2a.lasershot.red',    tint: '#ff4444' },
    { id: 'blue',   label: 'Blue',   projectile: 'jb2a.lasershot.blue',   tint: '#44aaff' },
    { id: 'green',  label: 'Green',  projectile: 'jb2a.lasershot.green',  tint: '#44ff66' }
  ],
  'laser-rifle': [
    { id: 'red',    label: 'Red',    projectile: 'jb2a.lasershot.red',    tint: '#ff4444' },
    { id: 'orange', label: 'Orange', projectile: 'jb2a.lasershot.orange', tint: '#ff8844' },
    { id: 'green',  label: 'Green',  projectile: 'jb2a.lasershot.green',  tint: '#44ff66' }
  ],
  'plasma-doshko': [
    { id: 'bluepink', label: 'Blue/Pink', projectile: 'jb2a.energy_beam.normal.bluepink', tint: '#cc44ff' },
    { id: 'orange',   label: 'Orange',    projectile: 'jb2a.energy_beam.normal.orange',   tint: '#ff8800' }
  ]
};

/**
 * Variants pinned to a weapon trait slug. Walked in registry order; the first
 * matched trait in `system.traits.value` wins.
 *
 * Important for SF2E because melee plasma weapons (e.g. Plasma Doshko) file
 * under group "axe" but carry a "critical-plasma" trait — this is what lets
 * them inherit a plasma palette instead of generic axe visuals.
 */
export const TRAIT_VARIANTS = {
  'critical-plasma': [
    { id: 'bluepink', label: 'Blue/Pink', projectile: 'jb2a.energy_beam.normal.bluepink', tint: '#cc44ff' },
    { id: 'orange',   label: 'Orange',    projectile: 'jb2a.energy_beam.normal.orange',   tint: '#ff8800' },
    { id: 'green',    label: 'Green',     projectile: 'jb2a.energy_beam.normal.green',    tint: '#44ff66' }
  ]
};

/**
 * Variants per `system.group`. The most common bucket — covers every weapon
 * that doesn't have a more specific base or trait match.
 */
export const GROUP_VARIANTS = {
  laser: [
    { id: 'red',    label: 'Red',    projectile: 'jb2a.lasershot.red',    impact: 'jb2a.impact.011.orange', tint: '#ff4444' },
    { id: 'blue',   label: 'Blue',   projectile: 'jb2a.lasershot.blue',   impact: 'jb2a.impact.blue.0',     tint: '#44aaff' },
    { id: 'green',  label: 'Green',  projectile: 'jb2a.lasershot.green',  impact: 'jb2a.impact.green.0',    tint: '#44ff66' },
    { id: 'orange', label: 'Orange', projectile: 'jb2a.lasershot.orange', impact: 'jb2a.impact.011.orange', tint: '#ff8844' },
    { id: 'purple', label: 'Purple', projectile: 'jb2a.lasershot.purple', impact: 'jb2a.impact.011.purple', tint: '#aa44ff' }
  ],
  plasma: [
    { id: 'bluepink', label: 'Blue/Pink', projectile: 'jb2a.energy_beam.normal.bluepink', tint: '#cc44ff' },
    { id: 'orange',   label: 'Orange',    projectile: 'jb2a.energy_beam.normal.orange',   tint: '#ff8800' },
    { id: 'green',    label: 'Green',     projectile: 'jb2a.energy_beam.normal.green',    tint: '#44ff66' }
  ],
  cryo: [
    { id: 'blue',   label: 'Ice Blue',  projectile: 'jb2a.ray_of_frost.blue',  tint: '#88ccff' },
    { id: 'white',  label: 'Frostlight', projectile: 'jb2a.ray_of_frost.white', tint: '#eeeeff' }
  ],
  flame: [
    { id: 'orange', label: 'Orange', projectile: 'jb2a.fire_bolt.orange', tint: '#ff8844' },
    { id: 'blue',   label: 'Blue',   projectile: 'jb2a.fire_bolt.blue',   tint: '#44aaff' },
    { id: 'green',  label: 'Green',  projectile: 'jb2a.fire_bolt.green',  tint: '#44ff66' }
  ],
  shock: [
    { id: 'blue',   label: 'Blue',   projectile: 'jb2a.chain_lightning.primary.blue',   tint: '#44aaff' },
    { id: 'purple', label: 'Purple', projectile: 'jb2a.chain_lightning.primary.purple', tint: '#aa44ff' }
  ],
  sonic: [
    { id: 'blue',  label: 'Blue',  projectile: 'jb2a.thunderwave.center.blue',  tint: '#44aaff' },
    { id: 'green', label: 'Green', projectile: 'jb2a.thunderwave.center.green', tint: '#44ff66' }
  ],
  disintegrator: [
    { id: 'green',  label: 'Green',  projectile: 'jb2a.disintegrate.green',  tint: '#44ff66' },
    { id: 'purple', label: 'Purple', projectile: 'jb2a.disintegrate.purple', tint: '#aa44ff' }
  ],
  disruption: [
    { id: 'purple',   label: 'Purple',   projectile: 'jb2a.eldritch_blast.purple',   tint: '#aa44ff' },
    { id: 'dark_red', label: 'Dark Red', projectile: 'jb2a.eldritch_blast.dark_red', tint: '#aa1111' }
  ]
};

/**
 * Last-resort pool per `system.category` (simple/martial/advanced/unarmed).
 * Used when no base/trait/group variant defines a pool.
 */
export const CATEGORY_VARIANTS = {
  // Intentionally sparse — categories rarely justify visual variety on their
  // own. Defined here so the resolver always has something to fall back to
  // if a damage type pool is also empty.
};

/**
 * Damage-type fallback pool — keys are `system.damage.damageType` values.
 */
export const DAMAGE_TYPE_VARIANTS = {
  fire: [
    { id: 'orange', label: 'Orange', projectile: 'jb2a.fire_bolt.orange', tint: '#ff8844' },
    { id: 'blue',   label: 'Blue',   projectile: 'jb2a.fire_bolt.blue',   tint: '#44aaff' }
  ],
  cold: [
    { id: 'blue',  label: 'Ice Blue',  projectile: 'jb2a.ray_of_frost.blue',  tint: '#88ccff' },
    { id: 'white', label: 'Frostlight', projectile: 'jb2a.ray_of_frost.white', tint: '#eeeeff' }
  ],
  electricity: [
    { id: 'blue',   label: 'Blue',   projectile: 'jb2a.chain_lightning.primary.blue',   tint: '#44aaff' },
    { id: 'purple', label: 'Purple', projectile: 'jb2a.chain_lightning.primary.purple', tint: '#aa44ff' }
  ]
};

/**
 * Get the variant pool for a given signal kind + key. Returns an empty array
 * when nothing is registered, so callers can treat undefined keys as "no pool".
 *
 * @param {'base'|'trait'|'group'|'category'|'damage'} kind
 * @param {string} key
 * @returns {Array<Object>}
 */
export function getVariantPool(kind, key) {
  if (!key) return [];
  switch (kind) {
    case 'base':     return BASE_VARIANTS[key] ?? [];
    case 'trait':    return TRAIT_VARIANTS[key] ?? [];
    case 'group':    return GROUP_VARIANTS[key] ?? [];
    case 'category': return CATEGORY_VARIANTS[key] ?? [];
    case 'damage':   return DAMAGE_TYPE_VARIANTS[key] ?? [];
    default:         return [];
  }
}
