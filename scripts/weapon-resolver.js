// ============================================
// Intrinsics SF2E Animation Framework
// Weapon Resolver — extracts weapon metadata
// from SF2E (PF2E-based) items and resolves
// the best animation match.
// ============================================

import { GROUP_ANIMATIONS, CATEGORY_ANIMATIONS, DAMAGE_TYPE_ANIMATIONS, JB2A_FALLBACKS } from './animation-map.js';
import { getSetting } from './settings.js';
import { resolveOptionalSoundPath } from '../animations/helpers.js';
import { resolveOrAssignVariant } from './variants/variant-resolver.js';

const ELEMENTAL_GROUP_TYPES = {
  flame: 'fire',
  cryo: 'cold',
  shock: 'electricity',
  sonic: 'sonic',
  disruption: 'mental',
  disintegrator: 'void'
};

const MELEE_ELEMENTAL_TYPES = new Set([
  'fire',
  'cold',
  'electricity',
  'acid',
  'sonic',
  'mental',
  'poison',
  'vitality',
  'void'
]);

/**
 * @typedef {Object} WeaponInfo
 * @property {string|null}  weaponGroup      - e.g. "laser", "sword", "plasma"
 * @property {string|null}  weaponCategory   - e.g. "simple", "martial", "advanced", "unarmed"
 * @property {string|null}  baseItem         - e.g. "laser-pistol", "plasma-doshko"
 * @property {number|null}  range            - range increment (null or 0 for melee)
 * @property {string|null}  primaryDamageType - damage type, e.g. "fire", "slashing"
 * @property {string[]}     traits           - weapon traits array
 * @property {number}       shotCount        - number of shots per attack (1 for normal, >1 for automatic/volley/scatter)
 * @property {string|null}  itemId           - the item's UUID for per-item overrides
 * @property {string}       itemName         - display name
 * @property {Item|null}    _item            - the source item document (internal, for variant persistence)
 */

/**
 * Map of weapon traits → shot count override. The HIGHEST count among matched
 * traits wins (so "automatic, scatter" still gets 3 shots, not 2).
 */
const SHOT_COUNT_TRAITS = {
  automatic: 3,
  volley: 2,
  scatter: 2,
  'double-barrel': 2
};

/**
 * Extract structured weapon information from an SF2E weapon Item.
 *
 * SF2E uses PF2E-style data:
 *   - item.system.group     → weapon group (laser, sword, plasma, etc.)
 *   - item.system.category  → weapon category (simple, martial, advanced, unarmed)
 *   - item.system.range     → range increment (null/0 for melee)
 *   - item.system.damage.damageType → primary damage type
 *   - item.system.traits.value      → array of trait strings
 *
 * @param {Item} item - The SF2E weapon item
 * @returns {WeaponInfo}
 */
export function extractWeaponInfo(item) {
  if (!item?.system) {
    return {
      weaponGroup: null,
      weaponCategory: null,
      baseItem: null,
      range: null,
      primaryDamageType: null,
      traits: [],
      shotCount: 1,
      itemId: null,
      itemName: item?.name ?? 'Unknown',
      _item: null
    };
  }

  const sys = item.system;

  // Extract primary damage type
  let primaryDamageType = null;
  if (sys.damage?.damageType) {
    // PF2E/SF2E style: single damageType string
    primaryDamageType = sys.damage.damageType;
  } else if (sys.damage?.parts?.length > 0) {
    // Fallback: array-style damage parts
    const firstPart = sys.damage.parts[0];
    if (Array.isArray(firstPart)) {
      primaryDamageType = firstPart[1] ?? null;
    } else if (typeof firstPart === 'object' && firstPart?.damageType) {
      primaryDamageType = firstPart.damageType;
    }
  }

  // Extract range — could be a number, an object with value, or null
  let range = null;
  if (typeof sys.range === 'number') {
    range = sys.range;
  } else if (sys.range?.value) {
    range = Number(sys.range.value) || null;
  } else if (sys.range?.increment) {
    range = Number(sys.range.increment) || null;
  }

  const traits = sys.traits?.value ?? [];
  let shotCount = 1;
  for (const trait of traits) {
    const traitShots = SHOT_COUNT_TRAITS[trait];
    if (traitShots && traitShots > shotCount) shotCount = traitShots;
  }

  return {
    weaponGroup: sys.group ?? null,
    weaponCategory: sys.category ?? null,
    baseItem: sys.baseItem ?? null,
    range,
    primaryDamageType,
    traits,
    shotCount,
    itemId: item.uuid ?? item.id ?? null,
    itemName: item.name ?? 'Unknown',
    _item: item
  };
}

/**
 * Determine if this is a melee or ranged attack based on the range field.
 *
 * In SF2E/PF2E, weapons with a range increment are ranged weapons.
 * Weapons without a range increment (null or 0) are melee weapons.
 *
 * @param {WeaponInfo} info
 * @returns {'melee'|'ranged'}
 */
export function getAttackMode(info) {
  if (info.range && info.range > 0) return 'ranged';
  return 'melee';
}

/**
 * Resolve the animation data for a weapon, checking (in priority order):
 *   1. Per-item macro override (stored in settings)
 *   2. Custom group macro override (stored in settings)
 *   3. Default weapon group animation script (.js)
 *   4. Default weapon category animation script (.js)
 *   5. Damage type animation script (.js)
 *   6. JB2A fallback (if JB2A is installed)
 *   7. null (no animation found)
 *
 * Returned object may contain:
 *   - macro:     Foundry macro name/ID (if override)
 *   - script:    Path to JS animation script (default)
 *   - animation: Legacy Sequencer/JB2A file path (fallback)
 *   - type, scale, speed, etc.
 *
 * @param {WeaponInfo} info
 * @returns {Object|null} Animation data object or null
 */
export function resolveAnimation(info) {
  const debug = getSetting('debugMode');
  const attackMode = getAttackMode(info);

  if (debug) {
    console.log(`[ISAF] Resolving animation for: ${info.itemName}`, info);
  }

  // 1. Per-item macro override
  const itemOverrides = _getItemOverrides();
  if (info.itemId && itemOverrides[info.itemId]) {
    if (debug) console.log(`[ISAF] → Using per-item override for ${info.itemId}`);
    return itemOverrides[info.itemId];
  }

  // 2. Custom group macro override
  const customMappings = _getCustomMappings();
  if (info.weaponGroup && customMappings[info.weaponGroup]) {
    if (debug) console.log(`[ISAF] → Using custom mapping for group: ${info.weaponGroup}`);
    return _decorateAnimation(customMappings[info.weaponGroup], info, attackMode);
  }

  // 2b. Custom weapon category macro override
  if (info.weaponCategory && customMappings[`cat_${info.weaponCategory}`]) {
    if (debug) console.log(`[ISAF] → Using custom mapping for category: ${info.weaponCategory}`);
    return _decorateAnimation(customMappings[`cat_${info.weaponCategory}`], info, attackMode);
  }

  // 2d. Resolve (or first-time assign) a visual variant for this weapon.
  // The variant rides on every downstream animation path via _decorateAnimation
  // so scripts read context.variant.projectile instead of a hard-coded file.
  const variant = resolveOrAssignVariant(info._item ?? null, info);
  if (debug && variant) {
    console.log(`[ISAF] → Variant for ${info.itemName}: ${variant.id} (${variant.label ?? ''})`);
  }

  // 2c. Elemental melee groups (cryo/flame/shock/etc.) should use a melee animation,
  // not the default ranged beam for the same group key.
  if (attackMode === 'melee' && info.weaponGroup && ELEMENTAL_GROUP_TYPES[info.weaponGroup]) {
    if (debug) console.log(`[ISAF] → Using elemental melee script for group: ${info.weaponGroup}`);
    return _decorateAnimation({
      script: 'animations/melee/elemental.js',
      type: 'melee',
      scale: 1.0,
      speed: 300
    }, info, attackMode, ELEMENTAL_GROUP_TYPES[info.weaponGroup], variant);
  }

  // 3. Default weapon group animation script
  if (info.weaponGroup && GROUP_ANIMATIONS[info.weaponGroup]) {
    const anim = GROUP_ANIMATIONS[info.weaponGroup];
    if (debug) console.log(`[ISAF] → Using default group script: ${info.weaponGroup}`);
    return _decorateAnimation(anim, info, attackMode, null, variant);
  }

  // 4. Default weapon category animation script
  if (info.weaponCategory && CATEGORY_ANIMATIONS[info.weaponCategory]) {
    const anim = CATEGORY_ANIMATIONS[info.weaponCategory];
    if (debug) console.log(`[ISAF] → Using weapon category script: ${info.weaponCategory}`);
    return _decorateAnimation(anim, info, attackMode, null, variant);
  }

  // 5. Damage type animation script
  if (info.primaryDamageType && DAMAGE_TYPE_ANIMATIONS[info.primaryDamageType]) {
    const anim = DAMAGE_TYPE_ANIMATIONS[info.primaryDamageType];
    if (debug) console.log(`[ISAF] → Using damage type script: ${info.primaryDamageType}`);
    return _decorateAnimation(anim, info, attackMode, null, variant);
  }

  // 6. JB2A fallback
  if (_hasJB2A()) {
    const jb2aKey = info.weaponGroup ?? info.weaponCategory ?? info.primaryDamageType;
    const jb2aPath = jb2aKey ? JB2A_FALLBACKS[jb2aKey] : null;
    if (jb2aPath) {
      if (debug) console.log(`[ISAF] → Using JB2A fallback: ${jb2aPath}`);
      return _decorateAnimation({
        animation: jb2aPath,
        type: attackMode,
        scale: 1.0,
        speed: attackMode === 'melee' ? 300 : 800,
        isJB2A: true
      }, info, attackMode, null, variant);
    }
  }

  // 7. No animation found
  if (debug) console.log(`[ISAF] → No animation found for: ${info.itemName}`);
  return null;
}

function _decorateAnimation(anim, info, attackMode, forcedElementalStyle = null, variant = null) {
  if (!anim) return null;

  const elementalStyle = attackMode === 'melee'
    ? (forcedElementalStyle ?? _getElementalStyle(info))
    : null;

  const sound = anim.sound
    ?? variant?.sound
    ?? resolveOptionalSoundPath(attackMode, forcedElementalStyle ?? _getElementalStyle(info));

  // Range-band scaling: bucket the weapon's range increment into short/medium/
  // long and multiply the base scale by a band factor. Melee weapons (no range)
  // are a no-op so the multiplier is 1.
  const rangeBand = _getRangeBand(info.range);
  const bandMultiplier = RANGE_BAND_SCALE[rangeBand] ?? 1.0;

  return {
    ...anim,
    type: anim.type ?? attackMode,
    scale: (anim.scale ?? 1.0) * bandMultiplier,
    elementalStyle,
    sound,
    variant: variant ?? null,
    rangeBand
  };
}

const RANGE_BAND_SCALE = {
  melee: 1.0,
  short: 0.9,
  medium: 1.0,
  long: 1.15
};

function _getRangeBand(range) {
  if (!range || range <= 0) return 'melee';
  if (range <= 30) return 'short';
  if (range <= 100) return 'medium';
  return 'long';
}

function _getElementalStyle(info) {
  const groupElement = info.weaponGroup ? ELEMENTAL_GROUP_TYPES[info.weaponGroup] : null;
  const damageType = _normaliseDamageType(info.primaryDamageType);
  if (groupElement) return groupElement;
  if (damageType && MELEE_ELEMENTAL_TYPES.has(damageType)) return damageType;
  return null;
}

function _normaliseDamageType(damageType) {
  switch (damageType) {
    case 'electric':
    case 'electricity':
      return 'electricity';
    case 'cold':
    case 'cryo':
      return 'cold';
    default:
      return damageType ?? null;
  }
}

// --- Private Helpers ---

/**
 * Check if JB2A (free or patreon) is installed and active.
 * @returns {boolean}
 */
function _hasJB2A() {
  return (
    game.modules.get('jb2a_patreon')?.active ||
    game.modules.get('JB2A_DnD5e')?.active ||
    false
  );
}

/**
 * Load custom group mappings from settings.
 * @returns {Object}
 */
function _getCustomMappings() {
  try {
    const raw = getSetting('customMappings');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('[ISAF] Failed to parse custom mappings:', e);
    return {};
  }
}

/**
 * Load per-item overrides from settings.
 * @returns {Object}
 */
function _getItemOverrides() {
  try {
    const raw = getSetting('itemOverrides');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('[ISAF] Failed to parse item overrides:', e);
    return {};
  }
}
