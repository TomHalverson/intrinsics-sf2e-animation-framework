// ============================================
// Intrinsics SF2E Animation Framework
// Main Entry Point
// ============================================
//
// Auto-detects SF2E weapon attacks and plays
// matching animations from attacker → target
// using Sequencer.
//
// SF2E uses PF2E-style weapon data:
//   - item.system.group    → weapon group (laser, sword, plasma, etc.)
//   - item.system.category → weapon category (simple, martial, advanced)
//   - item.system.range    → range increment (null for melee)
//
// Animations are JS scripts (not video files).
// Each script exports a function that builds a
// Sequencer sequence. Overrides can point to
// Foundry macros instead.
//
// Hook:
//   createChatMessage — checks for attack-roll flags
//
// Animation resolution priority:
//   1. Per-item macro override
//   2. Custom group macro override (user config)
//   3. Default weapon group animation script (.js)
//   4. Default weapon category animation script (.js)
//   5. Damage type animation script (.js)
//   6. JB2A fallback
// ============================================

import { MODULE_ID, registerSettings, getSetting, setSetting } from './settings.js';
import { AnimationEngine } from './animation-engine.js';
import { extractWeaponInfo, resolveAnimation } from './weapon-resolver.js';
import { clearScriptCache } from './animation-script-loader.js';
import { buildVariantPool, rerollVariant, clearVariant } from './variants/variant-resolver.js';

let engine = null;

// Keep a reference for the API
const _weaponResolverRef = { extractWeaponInfo, resolveAnimation };

// ==================================================
// Module Initialization
// ==================================================

Hooks.once('init', () => {
  console.log(`[ISAF] Intrinsics SF2E Animation Framework | Initializing...`);

  // Register all settings
  registerSettings();
});

Hooks.once('ready', () => {
  // --- Dependency check: Sequencer ---
  if (!game.modules.get('sequencer')?.active) {
    ui.notifications.error(
      game.i18n.localize('ISAF.Notifications.SequencerMissing'),
      { permanent: true }
    );
    console.error('[ISAF] Sequencer module is not active. Animation framework disabled.');
    return;
  }

  // --- System check ---
  const systemId = game.system.id;
  const supportedSystems = ['sf2e', 'starfinder2e', 'pf2e', 'starfinder-field-test-for-pf2e'];
  if (!supportedSystems.includes(systemId)) {
    console.warn(`[ISAF] This module is designed for Starfinder 2E. Current system: ${systemId}`);
  }

  // --- Initialize the animation engine ---
  engine = new AnimationEngine();
  engine.registerHooks();

  // --- Register context menu integration for per-item overrides ---
  _registerItemContextMenu();

  console.log(`[ISAF] Intrinsics SF2E Animation Framework | Ready.`);
  console.log(`[ISAF] Animations enabled: ${getSetting('enabled')}`);
  console.log(`[ISAF] Debug mode: ${getSetting('debugMode')}`);
});

// ==================================================
// Per-Item Override via Context Menu
// ==================================================

/**
 * Add a right-click context menu option on weapon items in character sheets
 * to set a per-item animation override.
 */
function _registerItemContextMenu() {
  // Hook into the item sheet header buttons
  Hooks.on('getItemSheetHeaderButtons', (sheet, buttons) => {
    if (!game.user.isGM) return;

    const item = sheet.item;
    if (!item || item.type !== 'weapon') return;

    buttons.unshift({
      label: 'Set Animation Override',
      class: 'isaf-set-animation',
      icon: 'fas fa-wand-magic-sparkles',
      onclick: () => _openItemOverrideDialog(item)
    });
  });
}

/**
 * Open a dialog to set a per-item animation override.
 * @param {Item} item
 */
async function _openItemOverrideDialog(item) {
  const overrides = _getItemOverrides();
  const existing = overrides[item.uuid] ?? {};

  // Build macro dropdown options from available macros
  const macros = game.macros.contents
    .sort((a, b) => a.name.localeCompare(b.name));
  const macroOptions = macros
    .map(m => `<option value="${m.id}" ${existing.macro === m.id ? 'selected' : ''}>${m.name}</option>`)
    .join('');

  // Determine if this weapon is melee or ranged from its range field
  const weaponInfo = extractWeaponInfo(item);
  const attackMode = weaponInfo.range && weaponInfo.range > 0 ? 'ranged' : 'melee';

  // Variant pool — empty if no BASE/TRAIT/GROUP/CATEGORY/DAMAGE_TYPE registry
  // hit. Skip the variant section entirely when there's no choice to offer.
  const { pool: variantPool, source: variantSource } = buildVariantPool(weaponInfo);
  const assignedVariantId = item.getFlag?.(MODULE_ID, 'variant') ?? '';
  const variantOptions = variantPool
    .map(v => `<option value="${v.id}" ${assignedVariantId === v.id ? 'selected' : ''}>${v.label ?? v.id}</option>`)
    .join('');
  const variantSection = variantPool.length ? `
      <div class="form-group">
        <label>Visual Variant</label>
        <div class="form-fields">
          <select name="variant">
            <option value="">— Auto (seeded from item id) —</option>
            ${variantOptions}
          </select>
        </div>
        <p class="hint" style="color: #8899aa; font-size: 11px;">
          Pool source: <strong>${variantSource.kind}</strong>:<strong>${variantSource.key}</strong>
          (${variantPool.length} option${variantPool.length === 1 ? '' : 's'}).
          Use the Re-roll button to randomise.
        </p>
      </div>` : '';

  const content = `
    <form>
      <p style="color: #8899aa; font-size: 12px; margin-bottom: 10px;">
        Set a Foundry macro to override this weapon's animation, or pick a
        specific visual variant. The macro receives <code>sourceToken</code>,
        <code>targetToken</code>, <code>isHit</code>, <code>scale</code>,
        <code>speed</code>, <code>variant</code>, and <code>Sequence</code> as
        scope variables.
      </p>
      <div class="form-group">
        <label>Weapon Info</label>
        <div class="form-fields" style="color: #8899aa; font-size: 12px;">
          Base: <strong>${weaponInfo.baseItem ?? 'none'}</strong> |
          Group: <strong>${weaponInfo.weaponGroup ?? 'none'}</strong> |
          Category: <strong>${weaponInfo.weaponCategory ?? 'none'}</strong> |
          Mode: <strong>${attackMode}</strong>
        </div>
      </div>
      ${variantSection}
      <div class="form-group">
        <label>Override Macro</label>
        <div class="form-fields">
          <select name="macro">
            <option value="">— No override (use default script) —</option>
            ${macroOptions}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Scale</label>
        <div class="form-fields">
          <input type="number" name="scale" value="${existing.scale ?? 1.0}" step="0.1" min="0.1" max="5.0" />
        </div>
      </div>
      <div class="form-group">
        <label>Speed (ms)</label>
        <div class="form-fields">
          <input type="number" name="speed" value="${existing.speed ?? 800}" step="50" min="100" max="5000" />
        </div>
      </div>
    </form>
  `;

  const buttons = [
    {
      action: 'save',
      label: 'Save',
      icon: 'fas fa-save',
      default: true,
      callback: async (_event, _button, dialog) => {
        const root = dialog.element;
        const macro = root.querySelector('[name="macro"]').value.trim();
        const scale = parseFloat(root.querySelector('[name="scale"]').value) || 1.0;
        const speed = parseInt(root.querySelector('[name="speed"]').value, 10) || 800;
        const variantId = root.querySelector('[name="variant"]')?.value?.trim() ?? '';

        if (macro) {
          overrides[item.uuid] = {
            macro,
            scale,
            speed,
            type: attackMode,
            itemName: item.name
          };
        } else {
          delete overrides[item.uuid];
        }
        await setSetting('itemOverrides', JSON.stringify(overrides));

        // Variant: write if user picked one, clear if they chose "Auto".
        if (variantPool.length) {
          if (variantId) {
            await item.setFlag(MODULE_ID, 'variant', variantId).catch(err => {
              console.warn('[ISAF] Could not persist variant:', err);
            });
          } else if (assignedVariantId) {
            await clearVariant(item);
          }
        }

        ui.notifications.info(`Animation settings saved for ${item.name}.`);
      }
    }
  ];

  if (variantPool.length > 1) {
    buttons.push({
      action: 'reroll',
      label: 'Re-roll Variant',
      icon: 'fas fa-dice',
      callback: async () => {
        const picked = await rerollVariant(item, weaponInfo);
        if (picked) {
          ui.notifications.info(`Variant re-rolled: ${picked.label ?? picked.id} for ${item.name}.`);
        }
      }
    });
  }

  buttons.push({
    action: 'clear',
    label: 'Clear Override',
    icon: 'fas fa-trash',
    callback: async () => {
      delete overrides[item.uuid];
      await setSetting('itemOverrides', JSON.stringify(overrides));
      ui.notifications.info(`Animation override cleared for ${item.name}.`);
    }
  });

  buttons.push({
    action: 'cancel',
    label: 'Cancel',
    icon: 'fas fa-times'
  });

  await foundry.applications.api.DialogV2.wait({
    window: { title: `Animation Override: ${item.name}` },
    content,
    buttons
  });
}

/**
 * Parse item overrides from settings.
 * @returns {Object}
 */
function _getItemOverrides() {
  try {
    return JSON.parse(getSetting('itemOverrides') || '{}');
  } catch {
    return {};
  }
}

// ==================================================
// API — expose for macros and other modules
// ==================================================

Hooks.once('ready', () => {
  // Expose module API on the module object
  const moduleData = game.modules.get(MODULE_ID);
  if (moduleData) {
    moduleData.api = {
      /**
       * Manually trigger an animation for a weapon attack.
       * @param {Token} sourceToken
       * @param {Token} targetToken
       * @param {string} animationPath - Sequencer file path or JB2A database path
       * @param {Object} [options={}]
       * @param {number} [options.scale=1.0]
       * @param {number} [options.speed=800]
       * @param {string} [options.sound]
       * @param {number} [options.volume=0.5]
       */
      playAnimation: async (sourceToken, targetToken, animationPath, options = {}) => {
        if (typeof Sequence === 'undefined') {
          console.error('[ISAF] Sequencer not available.');
          return;
        }

        const seq = new Sequence(MODULE_ID);
        seq.effect()
          .file(animationPath)
          .atLocation(sourceToken)
          .stretchTo(targetToken)
          .scale(options.scale ?? 1.0)
          .speed(options.speed ?? 800)
          .zIndex(10);

        if (options.sound) {
          seq.sound()
            .file(options.sound)
            .volume(options.volume ?? 0.5);
        }

        await seq.play();
      },

      /**
       * Get the resolved animation data for a weapon item.
       * @param {Item} item
       * @returns {Object|null}
       */
      getAnimationForWeapon: (item) => {
        const { extractWeaponInfo, resolveAnimation } = _weaponResolverRef;
        const info = extractWeaponInfo(item);
        return resolveAnimation(info);
      },

      /**
       * Clear the animation script cache.
       * Useful after editing animation scripts without reloading.
       */
      clearScriptCache,

      /** The animation engine instance */
      engine
    };
  }
});
