// ============================================
// Intrinsics SF2E Animation Framework
// Default Animation Mappings
// ============================================
//
// Maps SF2E weapon groups, weapon categories, and damage types to JS
// animation scripts in the animations/ folder.
//
// SF2E uses a PF2E-style weapon classification:
//   - Weapon Group  (item.system.group)    — e.g. "laser", "sword", "plasma"
//   - Weapon Category (item.system.category) — e.g. "simple", "martial", "advanced"
//   - Range (item.system.range)             — determines melee vs ranged
//   - Damage Type (item.system.damage.damageType) — "fire", "slashing", etc.
//
// Animation script resolution priority:
//   1. Per-item macro override
//   2. Custom group macro override (user config)
//   3. Default group animation script (.js)
//   4. Default category animation script (.js)
//   5. Damage type animation script (.js)
//   6. JB2A fallback (if JB2A installed)
// ============================================

const MODULE_PATH = 'modules/intrinsics-sf2e-animation-framework';

/**
 * Default animation mappings keyed by weapon group (item.system.group).
 *
 * This is the PRIMARY animation resolver. Weapon groups define the type
 * of weapon (laser, plasma, sword, etc.) and map directly to animation scripts.
 *
 * Each entry can specify:
 *   - script:  Path to a JS animation script (relative to module root)
 *   - type:    'ranged' | 'melee' — how the animation plays
 *   - scale:   (optional) Default scale
 *   - speed:   (optional) Default speed (ms for projectile travel)
 */
export const GROUP_ANIMATIONS = {
  // =============================================
  // Sci-Fi Ranged Weapon Groups
  // =============================================
  laser: {
    script: 'animations/ranged/laser.js',
    type: 'ranged',
    scale: 1.0,
    speed: 800
  },

  plasma: {
    script: 'animations/ranged/plasma.js',
    type: 'ranged',
    scale: 1.0,
    speed: 1000
  },

  projectile: {
    script: 'animations/ranged/projectile.js',
    type: 'ranged',
    scale: 0.6,
    speed: 500
  },

  flame: {
    script: 'animations/ranged/flame.js',
    type: 'ranged',
    scale: 1.2,
    speed: 900
  },

  cryo: {
    script: 'animations/ranged/cryo.js',
    type: 'ranged',
    scale: 1.0,
    speed: 900
  },

  shock: {
    script: 'animations/ranged/shock.js',
    type: 'ranged',
    scale: 1.0,
    speed: 400
  },

  sonic: {
    script: 'animations/ranged/sonic.js',
    type: 'ranged',
    scale: 1.2,
    speed: 700
  },

  disintegrator: {
    script: 'animations/ranged/disintegrator.js',
    type: 'ranged',
    scale: 1.0,
    speed: 600
  },

  disruption: {
    script: 'animations/ranged/disruption.js',
    type: 'ranged',
    scale: 1.0,
    speed: 800
  },

  // =============================================
  // Traditional Ranged Weapon Groups
  // =============================================
  bow: {
    script: 'animations/ranged/projectile.js',
    type: 'ranged',
    scale: 0.7,
    speed: 500
  },

  crossbow: {
    script: 'animations/ranged/projectile.js',
    type: 'ranged',
    scale: 0.7,
    speed: 400
  },

  firearm: {
    script: 'animations/ranged/projectile.js',
    type: 'ranged',
    scale: 0.6,
    speed: 400
  },

  dart: {
    script: 'animations/ranged/projectile.js',
    type: 'ranged',
    scale: 0.5,
    speed: 600
  },

  sling: {
    script: 'animations/ranged/projectile.js',
    type: 'ranged',
    scale: 0.5,
    speed: 700
  },

  // =============================================
  // Melee Weapon Groups
  // =============================================
  sword: {
    script: 'animations/melee/slash.js',
    type: 'melee',
    scale: 1.0,
    speed: 300
  },

  axe: {
    script: 'animations/melee/slash.js',
    type: 'melee',
    scale: 1.2,
    speed: 300
  },

  knife: {
    script: 'animations/melee/slash.js',
    type: 'melee',
    scale: 0.8,
    speed: 250
  },

  brawling: {
    script: 'animations/melee/brawling.js',
    type: 'melee',
    scale: 1.0,
    speed: 250
  },

  club: {
    script: 'animations/melee/strike.js',
    type: 'melee',
    scale: 1.0,
    speed: 300
  },

  hammer: {
    script: 'animations/melee/strike.js',
    type: 'melee',
    scale: 1.2,
    speed: 350
  },

  flail: {
    script: 'animations/melee/strike.js',
    type: 'melee',
    scale: 1.0,
    speed: 350
  },

  pick: {
    script: 'animations/melee/thrust.js',
    type: 'melee',
    scale: 0.8,
    speed: 300
  },

  polearm: {
    script: 'animations/melee/thrust.js',
    type: 'melee',
    scale: 1.2,
    speed: 350
  },

  spear: {
    script: 'animations/melee/thrust.js',
    type: 'melee',
    scale: 1.0,
    speed: 300
  },

  shield: {
    script: 'animations/melee/strike.js',
    type: 'melee',
    scale: 1.0,
    speed: 300
  },

  // =============================================
  // Thrown / AoE
  // =============================================
  bomb: {
    script: 'animations/thrown/bomb.js',
    type: 'ranged',
    scale: 0.8,
    speed: 1200
  }
};

/**
 * Fallback animations keyed by weapon category (item.system.category).
 * Used when no group-specific animation script is found.
 *
 * SF2E categories are: simple, martial, advanced, unarmed
 */
export const CATEGORY_ANIMATIONS = {
  simple: {
    script: 'animations/generic/generic.js',
    type: 'ranged',
    scale: 0.8,
    speed: 800
  },

  martial: {
    script: 'animations/generic/generic.js',
    type: 'ranged',
    scale: 1.0,
    speed: 700
  },

  advanced: {
    script: 'animations/generic/generic.js',
    type: 'ranged',
    scale: 1.2,
    speed: 600
  },

  unarmed: {
    script: 'animations/melee/brawling.js',
    type: 'melee',
    scale: 1.0,
    speed: 250
  }
};

/**
 * Damage-type-based animations as a tertiary fallback.
 * Keyed by the PF2E/SF2E damage type string.
 */
export const DAMAGE_TYPE_ANIMATIONS = {
  fire: {
    script: 'animations/ranged/flame.js',
    type: 'ranged',
    scale: 1.0,
    speed: 900
  },
  cold: {
    script: 'animations/ranged/cryo.js',
    type: 'ranged',
    scale: 1.0,
    speed: 900
  },
  electricity: {
    script: 'animations/ranged/shock.js',
    type: 'ranged',
    scale: 1.0,
    speed: 400
  },
  acid: {
    script: 'animations/generic/generic.js',
    type: 'ranged',
    scale: 0.8,
    speed: 1000
  },
  sonic: {
    script: 'animations/ranged/sonic.js',
    type: 'ranged',
    scale: 1.2,
    speed: 700
  },
  mental: {
    script: 'animations/ranged/disruption.js',
    type: 'ranged',
    scale: 0.8,
    speed: 600
  },
  poison: {
    script: 'animations/generic/generic.js',
    type: 'ranged',
    scale: 0.8,
    speed: 800
  },
  vitality: {
    script: 'animations/generic/generic.js',
    type: 'ranged',
    scale: 1.0,
    speed: 700
  },
  void: {
    script: 'animations/ranged/disruption.js',
    type: 'ranged',
    scale: 1.0,
    speed: 700
  },
  bludgeoning: {
    script: 'animations/melee/strike.js',
    type: 'melee',
    scale: 1.0,
    speed: 300
  },
  piercing: {
    script: 'animations/melee/thrust.js',
    type: 'melee',
    scale: 0.8,
    speed: 300
  },
  slashing: {
    script: 'animations/melee/slash.js',
    type: 'melee',
    scale: 1.0,
    speed: 300
  }
};

/**
 * JB2A fallback mappings.
 * Used when the user has JB2A installed but no animation scripts are found.
 * These use JB2A's Sequencer database paths.
 */
export const JB2A_FALLBACKS = {
  // Weapon groups — sci-fi ranged
  laser:         'jb2a.laser_beam.01.red',
  plasma:        'jb2a.energy_beam.normal.bluepink',
  projectile:    'jb2a.bullet.01.orange',
  flame:         'jb2a.fire_bolt.orange',
  cryo:          'jb2a.ray_of_frost.blue',
  shock:         'jb2a.chain_lightning.primary.blue',
  sonic:         'jb2a.thunderwave.center.blue',
  disintegrator: 'jb2a.disintegrate.green',
  disruption:    'jb2a.eldritch_blast.purple',

  // Weapon groups — traditional ranged
  bow:           'jb2a.arrow.physical.white.01',
  crossbow:      'jb2a.bolt.physical.white.01',
  firearm:       'jb2a.bullet.01.orange',
  dart:          'jb2a.bullet.01.orange',
  sling:         'jb2a.bullet.01.orange',

  // Weapon groups — melee
  sword:         'jb2a.melee_generic.slash.01.orange',
  axe:           'jb2a.melee_generic.slash.02.orange',
  knife:         'jb2a.melee_generic.slash.01.orange',
  brawling:      'jb2a.unarmed_strike.physical.01.blue',
  club:          'jb2a.melee_generic.slash.01.orange',
  hammer:        'jb2a.melee_generic.slash.02.orange',
  flail:         'jb2a.melee_generic.slash.02.orange',
  pick:          'jb2a.melee_generic.slash.01.orange',
  polearm:       'jb2a.melee_generic.slash.02.orange',
  spear:         'jb2a.melee_generic.slash.01.orange',
  shield:        'jb2a.melee_generic.slash.01.orange',

  // Weapon groups — thrown / AoE
  bomb:          'jb2a.throwable.throw.boulder.01',

  // Weapon categories
  simple:        'jb2a.magic_missile.purple',
  martial:       'jb2a.magic_missile.purple',
  advanced:      'jb2a.magic_missile.purple',
  unarmed:       'jb2a.unarmed_strike.physical.01.blue',

  // Damage types
  fire:          'jb2a.fire_bolt.orange',
  cold:          'jb2a.ray_of_frost.blue',
  electricity:   'jb2a.chain_lightning.primary.blue',
  acid:          'jb2a.magic_missile.green',
  sonic_dmg:     'jb2a.thunderwave.center.blue',
  mental:        'jb2a.eldritch_blast.purple',
  poison:        'jb2a.magic_missile.green',
  vitality:      'jb2a.healing_word.01.blue',
  void:          'jb2a.eldritch_blast.dark_red',
  bludgeoning:   'jb2a.melee_generic.slash.01.orange',
  piercing:      'jb2a.melee_generic.slash.01.orange',
  slashing:      'jb2a.melee_generic.slash.01.orange'
};

/**
 * Get the module's animation base path.
 * @returns {string}
 */
export function getModulePath() {
  return MODULE_PATH;
}
