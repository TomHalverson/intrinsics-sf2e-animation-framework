// ============================================
// Intrinsics SF2E Animation Framework
// Animation Configuration Application
// ============================================

import { MODULE_ID, getSetting, setSetting } from './settings.js';
import { GROUP_ANIMATIONS, CATEGORY_ANIMATIONS, DAMAGE_TYPE_ANIMATIONS, getModulePath } from './animation-map.js';
import { clearScriptCache } from './animation-script-loader.js';

/**
 * FormApplication for configuring animation mappings.
 * Accessible via module settings → "Configure Animations" button.
 *
 * The default animation for each weapon group is a JS script in the
 * animations/ folder. Users can override any group or individual
 * item with a Foundry macro.
 */
export class AnimationConfigApp extends FormApplication {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'isaf-animation-config',
      title: game.i18n.localize('ISAF.Config.Title'),
      template: `modules/${MODULE_ID}/templates/animation-config.hbs`,
      classes: ['isaf-config'],
      width: 700,
      height: 'auto',
      resizable: true,
      tabs: [{ navSelector: '.tabs', contentSelector: '.tab-content', initial: 'groups' }]
    });
  }

  /** @override */
  getData() {
    const customMappings = this._getCustomMappings();
    const itemOverrides = this._getItemOverrides();

    // Build macro list for dropdowns
    const macros = game.macros.contents
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(m => ({ id: m.id, name: m.name }));

    // Build weapon group rows
    const groupRows = Object.entries(GROUP_ANIMATIONS).map(([key, data]) => ({
      key,
      label: game.i18n.localize(`ISAF.Config.GroupLabel.${key}`),
      defaultScript: data.script,
      macroOverride: customMappings[key]?.macro ?? '',
      scale: customMappings[key]?.scale ?? data.scale ?? 1.0,
      speed: customMappings[key]?.speed ?? data.speed ?? 800
    }));

    // Build weapon category rows
    const categoryRows = Object.entries(CATEGORY_ANIMATIONS).map(([key, data]) => ({
      key,
      label: game.i18n.localize(`ISAF.Config.CategoryLabel.${key}`),
      defaultScript: data.script,
      macroOverride: customMappings[`cat_${key}`]?.macro ?? '',
      scale: customMappings[`cat_${key}`]?.scale ?? data.scale ?? 1.0,
      speed: customMappings[`cat_${key}`]?.speed ?? data.speed ?? 800
    }));

    // Build item override rows
    const overrideRows = Object.entries(itemOverrides).map(([itemId, data]) => {
      const macroName = data.macro ? (game.macros.get(data.macro)?.name ?? data.macro) : '';
      return {
        itemId,
        itemName: data.itemName ?? itemId,
        macro: data.macro ?? '',
        macroName,
        scale: data.scale ?? 1.0,
        speed: data.speed ?? 800
      };
    });

    return {
      groupRows,
      categoryRows,
      overrideRows,
      macros,
      modulePath: getModulePath()
    };
  }

  /** @override */
  async _updateObject(event, formData) {
    const customMappings = {};

    // Process form data — fields are named like "group_{key}_macro", "cat_{key}_macro", etc.
    for (const [field, value] of Object.entries(formData)) {
      const groupMatch = field.match(/^group_(.+?)_(macro|scale|speed)$/);
      if (groupMatch) {
        const [, key, prop] = groupMatch;
        if (!customMappings[key]) customMappings[key] = {};
        customMappings[key][prop] = prop === 'scale' || prop === 'speed' ? Number(value) : value;
        continue;
      }

      const catMatch = field.match(/^cat_(.+?)_(macro|scale|speed)$/);
      if (catMatch) {
        const [, key, prop] = catMatch;
        const mappingKey = `cat_${key}`;
        if (!customMappings[mappingKey]) customMappings[mappingKey] = {};
        customMappings[mappingKey][prop] = prop === 'scale' || prop === 'speed' ? Number(value) : value;
        continue;
      }
    }

    // Remove entries where no macro override is set (user cleared the override)
    for (const [key, data] of Object.entries(customMappings)) {
      if (!data.macro) delete customMappings[key];
    }

    await setSetting('customMappings', JSON.stringify(customMappings));

    ui.notifications.info('Animation mappings saved.');
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Reset button
    html.find('.isaf-btn-reset').on('click', async (ev) => {
      ev.preventDefault();
      await setSetting('customMappings', '{}');
      await setSetting('itemOverrides', '{}');
      clearScriptCache();
      this.render(true);
      ui.notifications.info('Animation mappings reset to defaults.');
    });

    // Test buttons
    html.find('.isaf-btn-test').on('click', (ev) => {
      ev.preventDefault();
      const row = ev.currentTarget.closest('tr');
      const macroId = row?.querySelector('select[name$="_macro"]')?.value;
      const scriptPath = row?.querySelector('.isaf-default-script')?.dataset?.script;

      if (macroId) {
        this._testMacro(macroId);
      } else if (scriptPath) {
        this._testScript(scriptPath);
      } else {
        ui.notifications.warn('No animation script or macro to test.');
      }
    });

    // Remove override buttons
    html.find('.btn-remove-override').on('click', async (ev) => {
      ev.preventDefault();
      const itemId = ev.currentTarget.dataset.itemId;
      if (itemId) {
        const overrides = this._getItemOverrides();
        delete overrides[itemId];
        await setSetting('itemOverrides', JSON.stringify(overrides));
        this.render(true);
      }
    });

    // Refresh script cache button
    html.find('.isaf-btn-refresh-cache').on('click', (ev) => {
      ev.preventDefault();
      clearScriptCache();
      ui.notifications.info('Animation script cache cleared. Scripts will be re-loaded on next use.');
    });
  }

  /**
   * Test a macro by executing it with the controlled token.
   * @param {string} macroId
   */
  async _testMacro(macroId) {
    const macro = game.macros.get(macroId);
    if (!macro) {
      ui.notifications.error('Macro not found.');
      return;
    }

    const token = canvas.tokens.controlled[0];
    if (!token) {
      ui.notifications.warn('Select a token on the canvas to test the animation.');
      return;
    }

    try {
      const seq = new Sequence(MODULE_ID);
      await macro.execute({
        sourceToken: token,
        targetToken: token,
        isHit: true,
        scale: 1.0,
        speed: 800,
        attackMode: 'ranged',
        weaponInfo: {},
        soundVolume: 0.5,
        soundEnabled: true,
        Sequence,
        MODULE_ID
      });
    } catch (err) {
      console.error('[ISAF] Macro test error:', err);
      ui.notifications.error('Error executing macro. Check console.');
    }
  }

  /**
   * Test-play an animation script on a controlled token.
   * @param {string} scriptPath
   */
  async _testScript(scriptPath) {
    if (typeof Sequence === 'undefined') {
      ui.notifications.error('Sequencer module is required to preview animations.');
      return;
    }

    const token = canvas.tokens.controlled[0];
    if (!token) {
      ui.notifications.warn('Select a token on the canvas to preview the animation.');
      return;
    }

    try {
      const { executeAnimationScript } = await import('./animation-script-loader.js');
      const success = await executeAnimationScript(scriptPath, {
        sourceToken: token,
        targetToken: token,
        isHit: true,
        scale: 1.0,
        speed: 800,
        attackMode: 'ranged',
        weaponInfo: {},
        soundVolume: 0.5,
        soundEnabled: true
      });
      if (!success) {
        ui.notifications.warn(`Animation script not found: ${scriptPath}`);
      }
    } catch (err) {
      console.error('[ISAF] Script test error:', err);
      ui.notifications.error('Error executing script. Check console.');
    }
  }

  /**
   * Parse custom mappings from settings.
   * @returns {Object}
   */
  _getCustomMappings() {
    try {
      return JSON.parse(getSetting('customMappings') || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Parse item overrides from settings.
   * @returns {Object}
   */
  _getItemOverrides() {
    try {
      return JSON.parse(getSetting('itemOverrides') || '{}');
    } catch {
      return {};
    }
  }
}
