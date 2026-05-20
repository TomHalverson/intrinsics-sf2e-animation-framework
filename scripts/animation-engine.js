// ============================================
// Intrinsics SF2E Animation Framework
// Animation Engine — plays animations via
// Sequencer based on weapon attack data.
//
// SF2E uses PF2E-style hooks and data structures.
// The primary hook is createChatMessage, checking
// for attack-roll type messages via system flags.
//
// Animations are JS scripts or Foundry macros,
// NOT video files. Scripts live in animations/
// and macros are user-defined overrides.
// ============================================

import { MODULE_ID, getSetting } from './settings.js';
import { extractWeaponInfo, resolveAnimation, getAttackMode } from './weapon-resolver.js';
import { executeAnimationScript, executeMacroOverride } from './animation-script-loader.js';

/**
 * AnimationEngine handles intercepting attack rolls from the SF2E system
 * (PF2E-based) and playing the appropriate Sequencer animations.
 */
export class AnimationEngine {
  constructor() {
    /** @type {number} Throttle — minimum ms between animations for same source */
    this._throttleMs = 200;
    /** @type {Map<string, number>} Last animation time per token ID */
    this._lastAnimTime = new Map();
  }

  // ==================================================
  // Initialization
  // ==================================================

  /**
   * Register all hooks for intercepting attacks.
   *
   * In SF2E/PF2E, the primary hook is createChatMessage.
   * Attack roll messages carry system flags with context info
   * including the attack type and outcome (hit/miss).
   */
  registerHooks() {
    Hooks.on('createChatMessage', (message) => this._onChatMessage(message));

    console.log(`[ISAF] AnimationEngine hooks registered.`);
  }

  // ==================================================
  // Hook Handlers
  // ==================================================

  /**
   * Handle createChatMessage for SF2E/PF2E attack rolls.
   *
   * PF2E-style messages carry flags under the system namespace:
   *   flags.pf2e.context.type === 'attack-roll'
   *   flags.pf2e.context.outcome === 'success' | 'criticalSuccess' | 'failure' | 'criticalFailure'
   *   flags.pf2e.origin.uuid → item UUID
   *
   * SF2E may use 'sf2e' or 'pf2e' as the flag namespace, so we check both.
   *
   * @param {ChatMessage} message
   */
  async _onChatMessage(message) {
    if (!this._shouldAnimate()) return;

    // Check for SF2E or PF2E attack roll flags
    const flags = this._getSystemFlags(message);
    if (!flags?.context) return;

    const isAttack = flags.context.type === 'attack-roll';
    if (!isAttack) return;

    // Extract the item from the message
    const item = await this._getItemFromMessage(message, flags);
    if (!item) return;

    // Only weapon-type items should trigger animations
    if (item.type !== 'weapon' && item.type !== 'melee' && item.type !== 'equipment') return;

    // Resolve the actor
    const actor = this._getActorFromMessage(message);
    if (!actor) return;

    // Only the animation owner should play it (prevents duplicates)
    if (!this._isAnimationOwner(actor)) return;

    const debug = getSetting('debugMode');
    if (debug) console.log('[ISAF] Attack roll detected', { actor: actor?.name, item: item?.name });

    // Determine hit/miss from the outcome
    const outcome = flags.context.outcome ?? null;
    const isHit = this._isHitOutcome(outcome);

    const onlyOnHit = getSetting('onlyOnHit');

    if (onlyOnHit && !isHit) {
      if (getSetting('missAnimation')) {
        await this._playAnimation(actor, item, false);
      }
      return;
    }

    await this._playAnimation(actor, item, isHit);
  }

  // ==================================================
  // Flag / Data Extraction Helpers
  // ==================================================

  /**
   * Get system flags from a chat message.
   * Checks for SF2E flags first, then falls back to PF2E flags.
   *
   * @param {ChatMessage} message
   * @returns {Object|null}
   */
  _getSystemFlags(message) {
    // Check SF2E-specific namespaces first
    return message.flags?.sf2e
        ?? message.flags?.starfinder2e
        ?? message.flags?.pf2e
        ?? null;
  }

  /**
   * Extract the weapon item from a chat message using origin flags.
   *
   * @param {ChatMessage} message
   * @param {Object} flags - The resolved system flags
   * @returns {Item|null}
   */
  async _getItemFromMessage(message, flags) {
    // Method 1: Direct item reference (PF2E provides this in some versions)
    if (message.item) return message.item;

    // Method 2: From origin UUID in flags
    const originUuid = flags.origin?.uuid;
    if (originUuid) {
      try {
        return await fromUuid(originUuid);
      } catch { /* not a valid UUID */ }
    }

    // Method 3: From actor + item source ID
    const actor = this._getActorFromMessage(message);
    if (actor) {
      const sourceId = flags.origin?.sourceId;
      if (sourceId) {
        const item = actor.items.get(sourceId);
        if (item) return item;
      }
    }

    return null;
  }

  /**
   * Get the actor from a chat message.
   *
   * @param {ChatMessage} message
   * @returns {Actor|null}
   */
  _getActorFromMessage(message) {
    const speaker = message.speaker;
    if (!speaker?.actor) return null;
    return game.actors.get(speaker.actor) ?? null;
  }

  /**
   * Determine if the outcome represents a hit.
   *
   * PF2E outcomes: 'criticalSuccess', 'success', 'failure', 'criticalFailure'
   *
   * @param {string|null} outcome
   * @returns {boolean}
   */
  _isHitOutcome(outcome) {
    if (!outcome) return true; // Default to hit if unknown
    return outcome === 'success' || outcome === 'criticalSuccess';
  }

  // ==================================================
  // Animation Playback
  // ==================================================

  /**
   * Resolve and play the animation for a weapon attack.
   * Supports three modes:
   *   1. Macro override — a Foundry macro builds the entire animation
   *   2. Animation script — a JS file in animations/ builds the sequence
   *   3. JB2A fallback — direct Sequencer file path (legacy behaviour)
   *
   * @param {Actor} actor  - The attacking actor
   * @param {Item}  item   - The weapon item
   * @param {boolean} isHit - Whether the attack hit
   */
  async _playAnimation(actor, item, isHit = true) {
    const debug = getSetting('debugMode');

    // 1. Resolve the source token
    const sourceToken = this._getActorToken(actor);
    if (!sourceToken) {
      if (debug) console.log('[ISAF] No source token found for actor:', actor?.name);
      return;
    }

    // 2. Throttle check
    if (!this._throttleCheck(sourceToken.id)) return;

    // 3. Get target tokens
    const targets = this._getTargets();
    if (targets.length === 0) {
      if (debug) console.log('[ISAF] No targets selected, skipping animation.');
      return;
    }

    // 4. Extract weapon info and resolve animation
    const weaponInfo = extractWeaponInfo(item);
    const animData = resolveAnimation(weaponInfo);

    if (!animData) {
      if (debug) console.log(`[ISAF] No animation found for weapon: ${weaponInfo.itemName}`);
      return;
    }

    // 5. Get global settings
    const globalScale = getSetting('animationScale');
    const globalSpeed = getSetting('animationSpeed');
    const soundEnabled = getSetting('soundEnabled');
    const soundVolume = getSetting('soundVolume');

    const finalScale = (animData.scale ?? 1.0) * globalScale;
    const finalSpeed = (animData.speed ?? 800) / globalSpeed;
    const attackMode = animData.type ?? getAttackMode(weaponInfo);

    if (debug) {
      console.log(`[ISAF] Playing animation:`, {
        weapon: weaponInfo.itemName,
        group: weaponInfo.weaponGroup,
        category: weaponInfo.weaponCategory,
        range: weaponInfo.range,
        mode: attackMode,
        macro: animData.macro ?? null,
        script: animData.script ?? null,
        animation: animData.animation ?? null,
        sound: animData.sound ?? null,
        elementalStyle: animData.elementalStyle ?? null,
        scale: finalScale,
        speed: finalSpeed,
        targets: targets.length,
        isHit
      });
    }

    // 6. Play the animation for each target
    for (const targetToken of targets) {
      try {
        const animationTarget = this._resolveAnimationTarget(sourceToken, targetToken, attackMode, isHit);
        const context = {
          sourceToken,
          targetToken,
          animationTarget,
          isHit,
          scale: finalScale,
          speed: finalSpeed,
          attackMode,
          weaponInfo,
          soundVolume,
          soundEnabled,
          soundPath: animData.sound ?? null,
          elementalStyle: animData.elementalStyle ?? null
        };

        // Priority: macro override → animation script → legacy file path
        if (animData.macro) {
          // User has set a macro override
          const success = await executeMacroOverride(animData.macro, context);
          if (!success && debug) {
            console.warn(`[ISAF] Macro override failed: ${animData.macro}, falling back.`);
          }
          if (success) continue;
        }

        if (animData.script) {
          // Default: run the JS animation script
          const success = await executeAnimationScript(animData.script, context);
          if (success) continue;
          if (debug) console.log(`[ISAF] Script not found: ${animData.script}, trying legacy/JB2A path.`);
        }

        // Fallback: legacy Sequencer file path (JB2A or direct .webm)
        if (animData.animation) {
          await this._playSequencerAnimation({
            sourceToken,
            targetToken,
            animData,
            attackMode,
            finalScale,
            finalSpeed,
            soundEnabled,
            soundVolume,
            isHit,
            animationTarget
          });
        }
      } catch (err) {
        console.error(`[ISAF] Error playing animation:`, err);
      }
    }
  }

  /**
   * Execute a single Sequencer animation from source to target.
   *
   * @param {Object} params
   * @param {Token}  params.sourceToken
   * @param {Token}  params.targetToken
   * @param {Object} params.animData
   * @param {string} params.attackMode   - 'melee' | 'ranged'
   * @param {number} params.finalScale
   * @param {number} params.finalSpeed   - in ms
   * @param {boolean} params.soundEnabled
   * @param {number} params.soundVolume
   * @param {boolean} params.isHit
   * @param {Token|object} params.animationTarget
   */
  async _playSequencerAnimation({
    sourceToken, targetToken, animData, attackMode,
    finalScale, finalSpeed, soundEnabled, soundVolume, isHit, animationTarget
  }) {
    // Ensure Sequencer is available
    if (typeof Sequence === 'undefined') {
      console.error('[ISAF] Sequencer not available. Is the Sequencer module active?');
      return;
    }

    const seq = new Sequence(MODULE_ID);

    if (attackMode === 'melee') {
      // --- Melee Animation ---
      // Play effect on the target location (no projectile travel)
      const effect = seq.effect()
        .file(animData.animation)
        .atLocation(sourceToken)
        .stretchTo(animationTarget)
        .scale(finalScale)
        .zIndex(10);

      if (!isHit) {
        // Miss: reduce opacity and rotate slightly
        effect.opacity(0.4)
          .randomRotation();
      }

    } else {
      // --- Ranged Animation ---
      // Projectile travels from source to target
      const effect = seq.effect()
        .file(animData.animation)
        .atLocation(sourceToken)
        .stretchTo(animationTarget)
        .scale(finalScale)
        .speed(finalSpeed)
        .zIndex(10);

      if (!isHit) {
        effect.opacity(0.5);
      }
    }

    // --- Sound ---
    if (soundEnabled && animData.sound) {
      seq.sound()
        .file(animData.sound)
        .volume(soundVolume)
        .delay(attackMode === 'ranged' ? 0 : 100);
    }

    // Play the sequence
    await seq.play();
  }

  // ==================================================
  // Token Resolution
  // ==================================================

  /**
   * Find the token on the canvas that represents the given actor.
   * Prefers a controlled token, then falls back to any token owned by the actor.
   *
   * @param {Actor} actor
   * @returns {Token|null}
   */
  _getActorToken(actor) {
    if (!actor || !canvas.tokens) return null;

    // Check controlled tokens first
    const controlled = canvas.tokens.controlled;
    for (const token of controlled) {
      if (token.actor?.id === actor.id) return token;
    }

    // Fall back to finding any token for this actor on the scene
    const sceneTokens = canvas.tokens.placeables;
    for (const token of sceneTokens) {
      if (token.actor?.id === actor.id) return token;
    }

    return null;
  }

  /**
   * Get the current user's targeted tokens.
   * @returns {Token[]}
   */
  _getTargets() {
    return Array.from(game.user.targets).filter(t => t && canvas.tokens.placeables.includes(t));
  }

  // ==================================================
  // Utility
  // ==================================================

  /**
   * Check if animations should run at all.
   * @returns {boolean}
   */
  _shouldAnimate() {
    // Master toggle
    if (!getSetting('enabled')) return false;

    // Sequencer must be active
    if (!game.modules.get('sequencer')?.active) return false;

    // Must be on a canvas with tokens
    if (!canvas?.tokens) return false;

    return true;
  }

  /**
   * Determine if the current user is the one who should play the animation.
   * We want only the attacking user (or the GM if the attacker is unowned) to trigger it.
   *
   * @param {Actor} actor
   * @returns {boolean}
   */
  _isAnimationOwner(actor) {
    if (!actor) return false;

    // If the current user owns the actor, they should play the animation
    if (actor.isOwner) return true;

    // If no player owns the actor (NPC), only the active GM should play it
    const hasPlayerOwner = game.users.contents.some(
      u => !u.isGM && actor.testUserPermission(u, 'OWNER')
    );
    if (!hasPlayerOwner && game.user.isGM) return true;

    return false;
  }

  /**
   * Simple throttle to prevent animation spam from rapid attacks.
   * @param {string} tokenId
   * @returns {boolean} true if animation should proceed
   */
  _throttleCheck(tokenId) {
    const now = Date.now();
    const last = this._lastAnimTime.get(tokenId) ?? 0;
    if (now - last < this._throttleMs) return false;
    this._lastAnimTime.set(tokenId, now);
    return true;
  }

  /**
   * Calculate a miss offset — the projectile should land near but not on the target.
   * Returns a pixel offset.
   *
   * @param {Token} source
   * @param {Token} target
   * @returns {{x: number, y: number}}
   */
  _calculateMissOffset(source, target) {
    const gridSize = canvas.grid.size ?? 100;
    const angle = Math.atan2(
      target.center.y - source.center.y,
      target.center.x - source.center.x
    );

    const perpAngle = angle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
    const lateralDistance = gridSize * (0.45 + Math.random() * 0.35);
    const forwardDistance = gridSize * (-0.1 + Math.random() * 0.7);

    return {
      x: (Math.cos(perpAngle) * lateralDistance) + (Math.cos(angle) * forwardDistance),
      y: (Math.sin(perpAngle) * lateralDistance) + (Math.sin(angle) * forwardDistance)
    };
  }

  /**
   * Resolve the actual visual target location for an animation.
   * Ranged misses get an offset point so projectiles visibly miss.
   *
   * @param {Token} sourceToken
   * @param {Token} targetToken
   * @param {'melee'|'ranged'} attackMode
   * @param {boolean} isHit
   * @returns {Token|{x:number,y:number}}
   */
  _resolveAnimationTarget(sourceToken, targetToken, attackMode, isHit) {
    if (attackMode !== 'ranged' || isHit) return targetToken;

    const missOffset = this._calculateMissOffset(sourceToken, targetToken);
    return {
      x: targetToken.center.x + missOffset.x,
      y: targetToken.center.y + missOffset.y
    };
  }
}
