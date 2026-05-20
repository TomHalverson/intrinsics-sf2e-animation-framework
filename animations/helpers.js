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

  const file = ELEMENTAL_MELEE_FILES[context.elementalStyle];
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