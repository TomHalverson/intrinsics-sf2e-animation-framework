// ============================================
// Intrinsics SF2E Animation Framework
// Settings Registration
// ============================================

export const MODULE_ID = 'intrinsics-sf2e-animation-framework';

/**
 * Register all module settings.
 */
export function registerSettings() {
  // --- Master Toggle ---
  game.settings.register(MODULE_ID, 'enabled', {
    name: game.i18n.localize('ISAF.Settings.Enabled.Name'),
    hint: game.i18n.localize('ISAF.Settings.Enabled.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // --- Only on Hit ---
  game.settings.register(MODULE_ID, 'onlyOnHit', {
    name: game.i18n.localize('ISAF.Settings.OnlyOnHit.Name'),
    hint: game.i18n.localize('ISAF.Settings.OnlyOnHit.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  // --- Miss Effect ---
  game.settings.register(MODULE_ID, 'missAnimation', {
    name: game.i18n.localize('ISAF.Settings.MissAnimation.Name'),
    hint: game.i18n.localize('ISAF.Settings.MissAnimation.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // --- Animation Scale ---
  game.settings.register(MODULE_ID, 'animationScale', {
    name: game.i18n.localize('ISAF.Settings.AnimationScale.Name'),
    hint: game.i18n.localize('ISAF.Settings.AnimationScale.Hint'),
    scope: 'world',
    config: true,
    type: Number,
    default: 1.0,
    range: {
      min: 0.1,
      max: 3.0,
      step: 0.1
    }
  });

  // --- Animation Speed ---
  game.settings.register(MODULE_ID, 'animationSpeed', {
    name: game.i18n.localize('ISAF.Settings.AnimationSpeed.Name'),
    hint: game.i18n.localize('ISAF.Settings.AnimationSpeed.Hint'),
    scope: 'world',
    config: true,
    type: Number,
    default: 1.0,
    range: {
      min: 0.25,
      max: 3.0,
      step: 0.25
    }
  });

  // --- Sound Toggle ---
  game.settings.register(MODULE_ID, 'soundEnabled', {
    name: game.i18n.localize('ISAF.Settings.SoundEnabled.Name'),
    hint: game.i18n.localize('ISAF.Settings.SoundEnabled.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // --- Sound Volume ---
  game.settings.register(MODULE_ID, 'soundVolume', {
    name: game.i18n.localize('ISAF.Settings.SoundVolume.Name'),
    hint: game.i18n.localize('ISAF.Settings.SoundVolume.Hint'),
    scope: 'world',
    config: true,
    type: Number,
    default: 0.5,
    range: {
      min: 0.0,
      max: 1.0,
      step: 0.05
    }
  });

  // --- Debug Mode ---
  game.settings.register(MODULE_ID, 'debugMode', {
    name: game.i18n.localize('ISAF.Settings.DebugMode.Name'),
    hint: game.i18n.localize('ISAF.Settings.DebugMode.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  // --- Custom Mappings (hidden, stored as JSON string) ---
  game.settings.register(MODULE_ID, 'customMappings', {
    name: game.i18n.localize('ISAF.Settings.CustomMappings.Name'),
    hint: game.i18n.localize('ISAF.Settings.CustomMappings.Hint'),
    scope: 'world',
    config: false,
    type: String,
    default: '{}'
  });

  // --- Per-Item Overrides (hidden, stored as JSON string) ---
  game.settings.register(MODULE_ID, 'itemOverrides', {
    scope: 'world',
    config: false,
    type: String,
    default: '{}'
  });

  // --- Configuration Button ---
  game.settings.registerMenu(MODULE_ID, 'openConfig', {
    name: game.i18n.localize('ISAF.Settings.OpenConfig.Name'),
    label: game.i18n.localize('ISAF.Settings.OpenConfig.Label'),
    hint: game.i18n.localize('ISAF.Settings.OpenConfig.Hint'),
    icon: 'fas fa-film',
    type: AnimationConfigMenu,
    restricted: true
  });
}

/**
 * Retrieve a setting value.
 * @param {string} key
 * @returns {*}
 */
export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}

/**
 * Update a setting value.
 * @param {string} key
 * @param {*} value
 */
export async function setSetting(key, value) {
  return game.settings.set(MODULE_ID, key, value);
}

/**
 * Placeholder FormApplication for the settings menu button.
 * The actual UI is in AnimationConfigApp — this just opens it.
 */
class AnimationConfigMenu extends FormApplication {
  constructor(...args) {
    super(...args);
    // Dynamically import and open the config app
    import('./animation-config-app.js').then(module => {
      new module.AnimationConfigApp().render(true);
    });
  }

  /** @override */
  async _updateObject() {}

  /** @override */
  getData() { return {}; }
}
