// ============================================
// Intrinsics SF2E Animation Framework
// Animation Configuration Application
// ============================================
// V14: ApplicationV2 + HandlebarsApplicationMixin.

import { MODULE_ID, getSetting, setSetting } from './settings.js';
import { GROUP_ANIMATIONS, CATEGORY_ANIMATIONS, DAMAGE_TYPE_ANIMATIONS, getModulePath } from './animation-map.js';
import { clearScriptCache } from './animation-script-loader.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Form for configuring animation mappings.
 * Opened from the settings menu via the AnimationConfigMenu launcher.
 *
 * The default animation for each weapon group is a JS script in the
 * animations/ folder. Users can override any group or individual
 * item with a Foundry macro.
 */
export class AnimationConfigApp extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: 'isaf-animation-config',
    classes: ['isaf-config'],
    tag: 'form',
    window: {
      title: 'ISAF.Config.Title',
      icon: 'fas fa-film',
      resizable: true
    },
    position: {
      width: 700,
      height: 'auto'
    },
    form: {
      handler: AnimationConfigApp._onSubmit,
      submitOnChange: false,
      closeOnSubmit: false
    },
    actions: {
      reset: AnimationConfigApp._onReset,
      test: AnimationConfigApp._onTest,
      removeOverride: AnimationConfigApp._onRemoveOverride,
      refreshCache: AnimationConfigApp._onRefreshCache
    }
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/animation-config.hbs`
    }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: 'groups', label: 'ISAF.Config.Tab.Groups', icon: 'fas fa-crosshairs' },
        { id: 'categories', label: 'ISAF.Config.Tab.Categories', icon: 'fas fa-layer-group' },
        { id: 'overrides', label: 'ISAF.Config.Tab.Overrides', icon: 'fas fa-sliders-h' }
      ],
      initial: 'groups',
      labelPrefix: 'ISAF.Config.Tab'
    }
  };

  /** @override */
  async _prepareContext(_options) {
    const customMappings = this._getCustomMappings();
    const itemOverrides = this._getItemOverrides();

    const macros = game.macros.contents
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(m => ({ id: m.id, name: m.name }));

    const groupRows = Object.entries(GROUP_ANIMATIONS).map(([key, data]) => ({
      key,
      label: game.i18n.localize(`ISAF.Config.GroupLabel.${key}`),
      defaultScript: data.script,
      macroOverride: customMappings[key]?.macro ?? '',
      scale: customMappings[key]?.scale ?? data.scale ?? 1.0,
      speed: customMappings[key]?.speed ?? data.speed ?? 800
    }));

    const categoryRows = Object.entries(CATEGORY_ANIMATIONS).map(([key, data]) => ({
      key,
      label: game.i18n.localize(`ISAF.Config.CategoryLabel.${key}`),
      defaultScript: data.script,
      macroOverride: customMappings[`cat_${key}`]?.macro ?? '',
      scale: customMappings[`cat_${key}`]?.scale ?? data.scale ?? 1.0,
      speed: customMappings[`cat_${key}`]?.speed ?? data.speed ?? 800
    }));

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

  // ============================================
  // V2 form submit handler (replaces V1 _updateObject)
  // ============================================

  /**
   * @this AnimationConfigApp
   * @param {SubmitEvent} _event
   * @param {HTMLFormElement} _form
   * @param {FormDataExtended} formData
   */
  static async _onSubmit(_event, _form, formData) {
    const fields = formData.object;
    const customMappings = {};

    for (const [field, value] of Object.entries(fields)) {
      const groupMatch = field.match(/^group_(.+?)_(macro|scale|speed)$/);
      if (groupMatch) {
        const [, key, prop] = groupMatch;
        if (!customMappings[key]) customMappings[key] = {};
        customMappings[key][prop] = (prop === 'scale' || prop === 'speed') ? Number(value) : value;
        continue;
      }

      const catMatch = field.match(/^cat_(.+?)_(macro|scale|speed)$/);
      if (catMatch) {
        const [, key, prop] = catMatch;
        const mappingKey = `cat_${key}`;
        if (!customMappings[mappingKey]) customMappings[mappingKey] = {};
        customMappings[mappingKey][prop] = (prop === 'scale' || prop === 'speed') ? Number(value) : value;
        continue;
      }
    }

    // Drop entries with no macro override (user cleared it).
    for (const [key, data] of Object.entries(customMappings)) {
      if (!data.macro) delete customMappings[key];
    }

    await setSetting('customMappings', JSON.stringify(customMappings));
    ui.notifications.info('Animation mappings saved.');
  }

  // ============================================
  // Action handlers — V2 dispatches via data-action on each button.
  // `this` is the application instance.
  // ============================================

  /** @this AnimationConfigApp */
  static async _onReset() {
    await setSetting('customMappings', '{}');
    await setSetting('itemOverrides', '{}');
    clearScriptCache();
    this.render(true);
    ui.notifications.info('Animation mappings reset to defaults.');
  }

  /** @this AnimationConfigApp */
  static async _onTest(_event, target) {
    const row = target.closest('tr');
    const macroId = row?.querySelector('select[name$="_macro"]')?.value;
    const scriptPath = row?.querySelector('.isaf-default-script')?.dataset?.script;

    if (macroId) {
      this._testMacro(macroId);
    } else if (scriptPath) {
      this._testScript(scriptPath);
    } else {
      ui.notifications.warn('No animation script or macro to test.');
    }
  }

  /** @this AnimationConfigApp */
  static async _onRemoveOverride(_event, target) {
    const itemId = target.dataset.itemId;
    if (!itemId) return;
    const overrides = this._getItemOverrides();
    delete overrides[itemId];
    await setSetting('itemOverrides', JSON.stringify(overrides));
    this.render(true);
  }

  /** @this AnimationConfigApp */
  static _onRefreshCache() {
    clearScriptCache();
    ui.notifications.info('Animation script cache cleared. Scripts will be re-loaded on next use.');
  }

  // ============================================
  // Test helpers (unchanged behavior from V1)
  // ============================================

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

  _getCustomMappings() {
    try {
      return JSON.parse(getSetting('customMappings') || '{}');
    } catch {
      return {};
    }
  }

  _getItemOverrides() {
    try {
      return JSON.parse(getSetting('itemOverrides') || '{}');
    } catch {
      return {};
    }
  }
}
