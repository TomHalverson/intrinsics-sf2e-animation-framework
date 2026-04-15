// ============================================
// Intrinsics SF2E Animation Framework
// Weapon Resolver — extracts weapon metadata
// from SF2E (PF2E-based) items and resolves
// the best animation match.
// ============================================

import { GROUP_ANIMATIONS, CATEGORY_ANIMATIONS, DAMAGE_TYPE_ANIMATIONS, JB2A_FALLBACKS } from './animation-map.js';
import { getSetting, MODULE_ID } from './settings.js';

/**
 * @typedef {Object} WeaponInfo
 * @property {string|null}  weaponGroup      - e.g. "laser", "sword", "plasma"
 * @property {string|null}  weaponCategory   - e.g. "simple", "martial", "advanced", "unarmed"
 * @property {number|null}  range            - range increment (null or 0 for melee)
 * @property {string|null}  primaryDamageType - damage type, e.g. "fire", "slashing"
 * @property {string[]}     traits           - weapon traits array
 * @property {string|null}  itemId           - the item's UUID for per-item overrides
 * @property {string}       itemName         - display name
 */

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
      range: null,
      primaryDamageType: null,
      traits: [],
      itemId: null,
      itemName: item?.name ?? 'Unknown'
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

  return {
    weaponGroup: sys.group ?? null,
    weaponCategory: sys.category ?? null,
    range,
    primaryDamageType,
    traits: sys.traits?.value ?? [],
    itemId: item.uuid ?? item.id ?? null,
    itemName: item.name ?? 'Unknown'
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
    return customMappings[info.weaponGroup];
  }

  // 3. Default weapon group animation script
  if (info.weaponGroup && GROUP_ANIMATIONS[info.weaponGroup]) {
    const anim = GROUP_ANIMATIONS[info.weaponGroup];
    if (debug) console.log(`[ISAF] → Using default group script: ${info.weaponGroup}`);
    return anim;
  }

  // 4. Default weapon category animation script
  if (info.weaponCategory && CATEGORY_ANIMATIONS[info.weaponCategory]) {
    const anim = CATEGORY_ANIMATIONS[info.weaponCategory];
    if (debug) console.log(`[ISAF] → Using weapon category script: ${info.weaponCategory}`);
    return anim;
  }

  // 5. Damage type animation script
  if (info.primaryDamageType && DAMAGE_TYPE_ANIMATIONS[info.primaryDamageType]) {
    const anim = DAMAGE_TYPE_ANIMATIONS[info.primaryDamageType];
    if (debug) console.log(`[ISAF] → Using damage type script: ${info.primaryDamageType}`);
    return anim;
  }

  // 6. JB2A fallback
  if (_hasJB2A()) {
    const jb2aKey = info.weaponGroup ?? info.weaponCategory ?? info.primaryDamageType;
    const jb2aPath = jb2aKey ? JB2A_FALLBACKS[jb2aKey] : null;
    if (jb2aPath) {
      if (debug) console.log(`[ISAF] → Using JB2A fallback: ${jb2aPath}`);
      const mode = getAttackMode(info);
      return {
        animation: jb2aPath,
        type: mode,
        scale: 1.0,
        speed: mode === 'melee' ? 300 : 800,
        isJB2A: true
      };
    }
  }

  // 7. No animation found
  if (debug) console.log(`[ISAF] → No animation found for: ${info.itemName}`);
  return null;
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
