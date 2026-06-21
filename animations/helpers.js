const OPTIONAL_SOUND_MODULE_ID = 'pf2e-creature-sounds';

const OPTIONAL_SOUND_PATHS = {
  melee: 'modules/pf2e-creature-sounds/sounds/GameDevMarket/Animal_Monster/Beast/Attack/Beast_Attack_Impact-001.m4a',
  fire: 'modules/pf2e-creature-sounds/sounds/GameDevMarket/Gamemaster Audio - Pro Sound Collection/Magic_Spells/fireball_blast_projectile_spell_01.m4a',
  cold: 'modules/pf2e-creature-sounds/sounds/GameDevMarket/Gamemaster Audio - Pro Sound Collection/Magic_Spells/ice_blast_projectile_spell_01.m4a',
  electricity: 'modules/pf2e-creature-sounds/sounds/GameDevMarket/Animal_Monster/Beast/Attack/Beast_Attack_Impact-003.m4a',
  sonic: 'modules/pf2e-creature-sounds/sounds/GameDevMarket/Animal_Monster/Beast/Attack/Beast_Attack_Impact-004.m4a',
  acid: 'modules/pf2e-creature-sounds/sounds/GameDevMarket/Gamemaster Audio - Pro Sound Collection/Magic_Spells/water_blast_projectile_spell_01.m4a',
  poison: 'modules/pf2e-creature-sounds/sounds/GameDevMarket/Gamemaster Audio - Pro Sound Collection/Magic_Spells/water_blast_projectile_spell_02.m4a',
  vitality: 'modules/pf2e-creature-sounds/sounds/GameDevMarket/Gamemaster Audio - Pro Sound Collection/Magic_Spells/water_spell_impact_hit_01.m4a',
  void: 'modules/pf2e-creature-sounds/sounds/GameDevMarket/Animal_Monster/Beast/Attack/Beast_Attack_Impact-005.m4a',
  mental: 'modules/pf2e-creature-sounds/sounds/GameDevMarket/Animal_Monster/Beast/Attack/Beast_Attack_Impact-002.m4a'
};

const ELEMENTAL_MELEE_FILES = {
  fire: 'jb2a.fire_bolt.orange',
  cold: 'jb2a.ray_of_frost.blue',
  electricity: 'jb2a.chain_lightning.primary.blue',
  sonic: 'jb2a.thunderwave.center.blue',
  acid: 'jb2a.magic_missile.green',
  poison: 'jb2a.magic_missile.green',
  vitality: 'jb2a.healing_word.01.blue',
  void: 'jb2a.eldritch_blast.dark_red',
  mental: 'jb2a.eldritch_blast.purple'
};

export function getAnimationTarget(context) {
  return context.animationTarget ?? context.targetToken;
}

export function applyMissEffect(effect, context, { opacity = 0.5, randomRotation } = {}) {
  if (context.isHit) return effect;

  effect.opacity(opacity);

  const shouldRotate = randomRotation ?? context.attackMode === 'melee';
  if (shouldRotate) {
    effect.randomRotation();
  }

  return effect;
}

export function addAnimationSound(seq, context, { file = null, delay = 0, volumeMultiplier = 1 } = {}) {
  if (!context.soundEnabled) return false;

  const soundPath = file ?? context.soundPath ?? null;
  if (!soundPath) return false;

  const volume = Math.min(1, Math.max(0, (context.soundVolume ?? 0.5) * volumeMultiplier));
  seq.sound()
    .file(soundPath)
    .volume(volume)
    .delay(delay);

  return true;
}

export function addElementalMeleeOverlay(seq, context, { scaleMultiplier = 0.75, opacity = 0.75 } = {}) {
  if (context.attackMode !== 'melee') return null;

  const file = context.variant?.projectile ?? ELEMENTAL_MELEE_FILES[context.elementalStyle];
  if (!file) return null;

  const effect = seq.effect()
    .file(file)
    .atLocation(context.sourceToken)
    .stretchTo(getAnimationTarget(context))
    .scale((context.scale ?? 1.0) * scaleMultiplier)
    .opacity(context.isHit ? opacity : Math.min(opacity, 0.35))
    .zIndex(11);

  return effect;
}

export function resolveOptionalSoundPath(attackMode, elementalStyle = null) {
  const optionalModule = game.modules.get(OPTIONAL_SOUND_MODULE_ID);
  if (!optionalModule) return null;

  return OPTIONAL_SOUND_PATHS[elementalStyle] ?? OPTIONAL_SOUND_PATHS[attackMode] ?? null;
}

// ============================================
// Layered muzzle / impact effects
// ============================================

// Conservative defaults — only used when neither the resolved variant nor the
// calling script supplies a file. Picked from JB2A free so they exist for
// most users; per-variant overrides do the real work.
const DEFAULT_IMPACT_FILE = 'jb2a.impact.011.orange';

/**
 * Add a muzzle / origin flash at the source token. Plays on every shot of a
 * multi-shot burst so automatic fire reads as "muzzle flashing per round".
 * Returns null when no file is available (variant + caller both empty).
 *
 * @param {Object} seq
 * @param {Object} context
 * @param {{file?: string, scaleMultiplier?: number, delay?: number}} [opts]
 */
export function addMuzzleFlash(seq, context, { file, scaleMultiplier = 0.6, delay = 0 } = {}) {
  if (context.criticalMiss) return null; // fumble takes over the visuals
  const flashFile = file ?? context.variant?.muzzle ?? null;
  if (!flashFile) return null;

  return seq.effect()
    .file(flashFile)
    .atLocation(context.sourceToken)
    .scale((context.scale ?? 1.0) * scaleMultiplier)
    .delay(delay)
    .zIndex(11);
}

/**
 * Add an impact effect at the animation target. Hidden on miss, gated to the
 * final shot of a burst so impacts don't pile up during automatic fire. Skips
 * silently when the attack is a critical miss (fumble visuals take over).
 *
 * @param {Object} seq
 * @param {Object} context
 * @param {{file?: string, scaleMultiplier?: number, delay?: number}} [opts]
 */
export function addImpactEffect(seq, context, { file, scaleMultiplier = 0.7, delay = 100 } = {}) {
  if (!context.isHit) return null;
  if (context.criticalMiss) return null;

  const shotCount = context.shotCount ?? 1;
  const shotIndex = context.shotIndex ?? 0;
  if (shotCount > 1 && shotIndex !== shotCount - 1) return null;

  const impactFile = context.variant?.impact ?? file ?? DEFAULT_IMPACT_FILE;
  if (!impactFile) return null;

  const target = getAnimationTarget(context);
  if (!target) return null;

  return seq.effect()
    .file(impactFile)
    .atLocation(target)
    .scale((context.scale ?? 1.0) * scaleMultiplier)
    .delay(delay)
    .zIndex(12);
}

// ============================================
// Target reaction
// ============================================

const TARGET_REACTION_FILE = 'jb2a.impact.011.orange';

/**
 * Play a brief tinted flash on the target when an attack hits, giving the
 * impact some on-token feedback distinct from the projectile impact effect.
 *
 * Gated by:
 *  - context.targetReactionsEnabled (world setting)
 *  - context.isHit and not a critical miss
 *  - shotIndex === shotCount - 1 (only the final shot of a burst)
 *  - source token !== target token (no self-targeted reaction)
 *
 * Uses context.variant.tint when present so the reaction reads in the
 * weapon's color identity.
 *
 * @param {Object} seq
 * @param {Object} context
 * @param {{file?: string, scaleMultiplier?: number, delay?: number}} [opts]
 */
export function addTargetReaction(seq, context, { file, scaleMultiplier = 0.6, delay = 120 } = {}) {
  if (!context.targetReactionsEnabled) return null;
  if (!context.isHit || context.criticalMiss) return null;
  if (context.sourceToken?.id && context.sourceToken.id === context.targetToken?.id) return null;

  const shotCount = context.shotCount ?? 1;
  const shotIndex = context.shotIndex ?? 0;
  if (shotCount > 1 && shotIndex !== shotCount - 1) return null;

  const reactionFile = file ?? TARGET_REACTION_FILE;
  const tint = context.variant?.tint ?? null;
  const isCrit = context.criticalHit;

  const effect = seq.effect()
    .file(reactionFile)
    .atLocation(context.targetToken)
    .scale((context.scale ?? 1.0) * scaleMultiplier * (isCrit ? 1.5 : 1.0))
    .opacity(0.65)
    .delay(delay)
    .zIndex(13);

  if (tint) effect.tint(tint);

  // Crit echo: a second, slower flash for visual emphasis. No-op on a normal
  // hit so non-crit reactions stay subtle.
  if (isCrit) {
    const echo = seq.effect()
      .file(reactionFile)
      .atLocation(context.targetToken)
      .scale((context.scale ?? 1.0) * scaleMultiplier * 2.0)
      .opacity(0.45)
      .delay(delay + 120)
      .zIndex(13);
    if (tint) echo.tint(tint);
  }

  return effect;
}

// ============================================
// Crit / fumble visual treatment
// ============================================

const CRIT_SCALE_MULTIPLIER = 1.5;
const CRIT_BURST_FILE = 'jb2a.impact.011.orange';
const FUMBLE_FIZZLE_FILE = 'jb2a.smoke.puff.centered.grey.0';

/**
 * Scale up an effect on critical hits. Call AFTER `.scale(context.scale)` so
 * the multiplier compounds with the resolved per-weapon scale.
 *
 * @param {Object} effect - A Sequencer effect builder
 * @param {Object} context
 * @param {{multiplier?: number}} [opts]
 * @returns {Object} the effect for chaining
 */
export function applyCriticalScale(effect, context, { multiplier = CRIT_SCALE_MULTIPLIER } = {}) {
  if (!context.criticalHit) return effect;
  effect.scale((context.scale ?? 1.0) * multiplier);
  return effect;
}

/**
 * Add a secondary burst at the target on a critical hit. Uses the variant
 * impact file when defined, otherwise a generic orange impact. No-op when the
 * outcome wasn't a crit, when there's no target, or on a miss.
 *
 * @param {Object} seq
 * @param {Object} context
 * @param {{file?: string, scaleMultiplier?: number, delay?: number}} [opts]
 * @returns {Object|null} the effect, or null if not added
 */
export function addCriticalBurst(seq, context, { file, scaleMultiplier = 1.4, delay = 150 } = {}) {
  if (!context.criticalHit) return null;
  if (!context.isHit) return null;

  // For multi-shot bursts, only emit the impact at the final shot — otherwise
  // we'd stack identical bursts during automatic fire.
  const shotCount = context.shotCount ?? 1;
  const shotIndex = context.shotIndex ?? 0;
  if (shotCount > 1 && shotIndex !== shotCount - 1) return null;

  const target = getAnimationTarget(context);
  if (!target) return null;

  const burstFile = file ?? context.variant?.impact ?? CRIT_BURST_FILE;
  return seq.effect()
    .file(burstFile)
    .atLocation(target)
    .scale((context.scale ?? 1.0) * scaleMultiplier)
    .delay(delay)
    .zIndex(12);
}

/**
 * Replace a normal miss with a fumble fizzle on critical failure. Returns true
 * when a fumble effect was added (so callers can skip the normal effect chain
 * to avoid a doubled visual).
 *
 * @param {Object} seq
 * @param {Object} context
 * @param {{file?: string, scaleMultiplier?: number}} [opts]
 * @returns {boolean}
 */
export function addFumbleEffect(seq, context, { file, scaleMultiplier = 1.0 } = {}) {
  if (!context.criticalMiss) return false;

  seq.effect()
    .file(file ?? FUMBLE_FIZZLE_FILE)
    .atLocation(context.sourceToken)
    .scale((context.scale ?? 1.0) * scaleMultiplier)
    .opacity(0.7)
    .zIndex(9);

  return true;
}