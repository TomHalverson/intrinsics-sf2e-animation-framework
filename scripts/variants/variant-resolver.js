// ============================================
// Intrinsics SF2E Animation Framework
// Variant Resolver
// ============================================
//
// Picks a visual variant for a weapon the first
// time it fires, persists the choice to an item
// flag, and replays it consistently afterward.
//
// Resolution priority (first non-empty pool wins):
//   1. BASE_VARIANTS[system.baseItem]
//   2. TRAIT_VARIANTS[trait] for any trait in system.traits.value
//   3. GROUP_VARIANTS[system.group]
//   4. CATEGORY_VARIANTS[system.category]
//   5. DAMAGE_TYPE_VARIANTS[system.damage.damageType]
//
// When the pool is decided, the variant for THIS
// item is selected by:
//   - reading the persisted flag if it matches a
//     pool entry (consistency across fires); else
//   - hashing item.uuid into the pool index
//     (consistency across clients even when no
//     write has happened yet), then writing the
//     flag so future loads are O(1).
// ============================================

import { MODULE_ID } from '../settings.js';
import { getVariantPool } from './variant-registry.js';

const VARIANT_FLAG = 'variant';

const POOL_KINDS = [
  { kind: 'base',     getKey: info => info.baseItem },
  { kind: 'trait',    getKey: info => firstMatchingTrait(info) },
  { kind: 'group',    getKey: info => info.weaponGroup },
  { kind: 'category', getKey: info => info.weaponCategory },
  { kind: 'damage',   getKey: info => info.primaryDamageType }
];

/**
 * Build the variant pool for a weapon based on its info. The first signal that
 * defines a non-empty pool wins — no union, so a base entry can deliberately
 * restrict the available colors for that specific weapon.
 *
 * @param {Object} info - WeaponInfo from extractWeaponInfo
 * @returns {{pool: Array, source: {kind: string, key: string}|null}}
 */
export function buildVariantPool(info) {
  if (!info) return { pool: [], source: null };

  for (const { kind, getKey } of POOL_KINDS) {
    const key = getKey(info);
    if (!key) continue;
    const pool = getVariantPool(kind, key);
    if (pool.length) return { pool, source: { kind, key } };
  }

  return { pool: [], source: null };
}

/**
 * Resolve the variant for a fire event. Reads the persisted flag if present
 * and valid; otherwise picks deterministically and (best-effort) persists.
 *
 * @param {Item}   item - The weapon item document (may be null for compendium previews)
 * @param {Object} info - WeaponInfo from extractWeaponInfo
 * @returns {Object|null} The variant entry, or null if no pool exists for this weapon
 */
export function resolveOrAssignVariant(item, info) {
  const { pool } = buildVariantPool(info);
  if (!pool.length) return null;

  const existingId = item?.getFlag?.(MODULE_ID, VARIANT_FLAG);
  if (existingId) {
    const match = pool.find(v => v.id === existingId);
    if (match) return match;
  }

  const picked = pickVariant(pool, item);
  persistVariant(item, picked).catch(() => { /* best-effort */ });
  return picked;
}

/**
 * Re-roll a weapon's variant. Forces a new pick that differs from the current
 * assignment when the pool has 2+ entries. Used by the per-item dialog's
 * "Re-roll" action.
 *
 * @param {Item} item
 * @param {Object} info
 * @returns {Promise<Object|null>}
 */
export async function rerollVariant(item, info) {
  const { pool } = buildVariantPool(info);
  if (!pool.length) return null;

  const currentId = item?.getFlag?.(MODULE_ID, VARIANT_FLAG) ?? null;
  const candidates = pool.length > 1 ? pool.filter(v => v.id !== currentId) : pool;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  await persistVariant(item, picked).catch(() => {});
  return picked;
}

/**
 * Clear a weapon's persisted variant. Next fire will re-assign from the seed.
 * @param {Item} item
 */
export async function clearVariant(item) {
  if (!item?.unsetFlag) return;
  try {
    await item.unsetFlag(MODULE_ID, VARIANT_FLAG);
  } catch { /* item not writable */ }
}

/**
 * Pick a variant from the pool. When the item has a stable id we hash it and
 * use that as the index — every client computes the same pick without needing
 * the persisted flag, which makes compendium and unowned items behave
 * consistently. Without an id we fall back to a random pick.
 *
 * @param {Array}  pool
 * @param {Item|null} item
 * @returns {Object}
 */
export function pickVariant(pool, item) {
  const seed = item?.uuid ?? item?.id ?? null;
  if (!seed) return pool[Math.floor(Math.random() * pool.length)];
  const index = hashString(seed) % pool.length;
  return pool[index];
}

/**
 * Write the variant id to the item flag. Silently ignores permission and
 * compendium-lock errors — the seeded pick still gives a consistent result.
 *
 * @param {Item} item
 * @param {Object} variant
 */
async function persistVariant(item, variant) {
  if (!item?.setFlag || !variant?.id) return;
  if (item.pack && !game.user?.isGM) return; // skip compendium writes for non-GMs
  if (!item.isOwner) return;                  // skip if local user can't write
  await item.setFlag(MODULE_ID, VARIANT_FLAG, variant.id);
}

/**
 * Walk the weapon's traits and return the first one we have a registered
 * variant pool for. Order is determined by the trait array on the weapon,
 * which mirrors the order authors / the system put traits in — usually the
 * most defining trait first.
 *
 * @param {Object} info
 * @returns {string|null}
 */
function firstMatchingTrait(info) {
  const traits = info?.traits ?? [];
  for (const trait of traits) {
    if (getVariantPool('trait', trait).length) return trait;
  }
  return null;
}

/**
 * Simple deterministic string hash (FNV-1a 32-bit). Stable across browsers,
 * good enough for indexing into a small variant pool.
 *
 * @param {string} input
 * @returns {number}
 */
function hashString(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
