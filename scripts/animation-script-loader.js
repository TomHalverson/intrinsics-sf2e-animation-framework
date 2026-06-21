// ============================================
// Intrinsics SF2E Animation Framework
// Animation Script Loader
// ============================================
//
// Dynamically imports and executes JS animation
// scripts from the animations/ folder.
//
// Each animation script should export a default
// async function with the signature:
//
//   export default async function(seq, context) { ... }
//
// Where:
//   seq     — a Sequencer Sequence instance
//   context — { sourceToken, targetToken, isHit, scale, speed, ... }
//
// The function should add effects/sounds to the
// sequence. The caller will .play() it afterwards.
// ============================================

import { MODULE_ID } from './settings.js';

const MODULE_PATH = `modules/${MODULE_ID}`;

/**
 * Cache for loaded animation script modules.
 * @type {Map<string, Function|null>}
 */
const _scriptCache = new Map();

/**
 * Load and return the animation function from a JS script file.
 * Scripts are expected to be in the animations/ folder and export
 * a default async function.
 *
 * @param {string} scriptPath - Path relative to the module root,
 *   e.g. "animations/ranged/laser.js" or a full module path.
 * @returns {Function|null} The animation function, or null if not found.
 */
export async function loadAnimationScript(scriptPath) {
  // Normalise to full module path if needed
  const fullPath = scriptPath.startsWith(MODULE_PATH)
    ? scriptPath
    : `${MODULE_PATH}/${scriptPath}`;

  // Check cache
  if (_scriptCache.has(fullPath)) {
    return _scriptCache.get(fullPath);
  }

  try {
    const module = await import(`/${fullPath}`);
    const fn = module.default ?? module.execute ?? null;

    if (typeof fn !== 'function') {
      console.warn(`[ISAF] Animation script has no default export function: ${fullPath}`);
      _scriptCache.set(fullPath, null);
      return null;
    }

    _scriptCache.set(fullPath, fn);
    return fn;
  } catch (err) {
    // Script doesn't exist or failed to load — this is normal for
    // groups that haven't had scripts created yet.
    console.debug(`[ISAF] Could not load animation script: ${fullPath}`, err.message);
    _scriptCache.set(fullPath, null);
    return null;
  }
}

/**
 * Execute an animation script, creating and playing a Sequencer sequence.
 *
 * @param {string}  scriptPath - Path to the JS animation script
 * @param {Object}  context    - Animation context
 * @param {Token}   context.sourceToken
 * @param {Token}   context.targetToken
 * @param {boolean} context.isHit
 * @param {Token|object} context.animationTarget
 * @param {number}  context.scale
 * @param {number}  context.speed
 * @param {string}  context.attackMode - 'melee' | 'ranged'
 * @param {Object}  context.weaponInfo - The full WeaponInfo object
 * @param {number}  context.soundVolume
 * @param {boolean} context.soundEnabled
 * @param {string|null} context.soundPath
 * @param {string|null} context.elementalStyle
 * @returns {boolean} True if the script was found and executed successfully.
 */
export async function executeAnimationScript(scriptPath, context) {
  const fn = await loadAnimationScript(scriptPath);
  if (!fn) return false;

  try {
    const seq = new Sequence(MODULE_ID);
    await fn(seq, context);
    await seq.play();
    return true;
  } catch (err) {
    console.error(`[ISAF] Error executing animation script: ${scriptPath}`, err);
    return false;
  }
}

/**
 * Execute a Foundry VTT macro by name or ID as an animation override.
 *
 * The macro receives the animation context as macro arguments via
 * scope variables: sourceToken, targetToken, isHit, scale, speed, etc.
 *
 * @param {string}  macroRef - The macro name or UUID
 * @param {Object}  context  - Animation context (same as executeAnimationScript)
 * @returns {boolean} True if the macro was found and executed.
 */
export async function executeMacroOverride(macroRef, context) {
  if (!macroRef) return false;

  let macro = null;

  // Try by UUID first
  try {
    macro = await fromUuid(macroRef);
  } catch { /* not a UUID */ }

  // Try by ID
  if (!macro) {
    macro = game.macros.get(macroRef);
  }

  // Try by name
  if (!macro) {
    macro = game.macros.getName(macroRef);
  }

  if (!macro) {
    console.warn(`[ISAF] Macro not found: ${macroRef}`);
    return false;
  }

  try {
    // Build a scope object so the macro can access animation context
    const scope = {
      sourceToken: context.sourceToken,
      targetToken: context.targetToken,
      isHit: context.isHit,
      outcome: context.outcome ?? null,
      criticalHit: context.criticalHit ?? false,
      criticalMiss: context.criticalMiss ?? false,
      shotIndex: context.shotIndex ?? 0,
      shotCount: context.shotCount ?? 1,
      scale: context.scale,
      speed: context.speed,
      attackMode: context.attackMode,
      weaponInfo: context.weaponInfo,
      soundVolume: context.soundVolume,
      soundEnabled: context.soundEnabled,
      variant: context.variant ?? null,
      rangeBand: context.rangeBand ?? 'melee',
      Sequence,
      MODULE_ID
    };

    await macro.execute(scope);
    return true;
  } catch (err) {
    console.error(`[ISAF] Error executing macro override: ${macroRef}`, err);
    return false;
  }
}

/**
 * Clear the script cache (useful after hot-reloading scripts).
 */
export function clearScriptCache() {
  _scriptCache.clear();
  console.log('[ISAF] Animation script cache cleared.');
}
