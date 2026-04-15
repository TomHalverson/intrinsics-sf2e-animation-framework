# Animation Scripts

Animations are **JavaScript files** (not video files). Each script exports a default
async function that receives a Sequencer `Sequence` and an animation context object.

## How It Works

1. When an attack is made, the framework detects the attack roll via chat message flags
2. It extracts the weapon's **group**, **category**, and **range** from the item data
3. It looks up the matching `.js` script in this folder
4. The script builds a Sequencer animation (effects, sounds, etc.)
5. The framework plays the sequence

**Macro Overrides**: Any weapon group or individual weapon can be overridden with a
Foundry macro via the config UI or right-click menu. Macros receive the same
context variables.

## SF2E Weapon Data Model

SF2E uses PF2E-style weapon classification:

| Field | Path | Example Values |
|-------|------|----------------|
| **Weapon Group** | `item.system.group` | `laser`, `sword`, `plasma`, `bow` |
| **Weapon Category** | `item.system.category` | `simple`, `martial`, `advanced`, `unarmed` |
| **Range** | `item.system.range` | `null` (melee), `30` (ranged) |
| **Damage Type** | `item.system.damage.damageType` | `fire`, `slashing`, `piercing` |

## Animation Resolution Priority

1. **Per-item macro override** — set via right-click on a weapon item
2. **Custom group macro override** — set via the config UI
3. **Weapon group script** — matches `item.system.group` (e.g. "laser" → `ranged/laser.js`)
4. **Weapon category script** — matches `item.system.category` (e.g. "unarmed" → `melee/brawling.js`)
5. **Damage type script** — matches `item.system.damage.damageType`
6. **JB2A fallback** — direct Sequencer database path

## Script Format

Each script must export a default async function:

```js
// animations/ranged/laser.js
export default async function laser(seq, context) {
  // seq     — a Sequencer Sequence instance (add effects/sounds to it)
  // context — { sourceToken, targetToken, isHit, scale, speed, attackMode,
  //             weaponInfo, soundVolume, soundEnabled }

  const effect = seq.effect()
    .file('jb2a.lasershot.red')
    .atLocation(context.sourceToken)
    .stretchTo(context.targetToken)
    .scale(context.scale)
    .zIndex(10);

  if (!context.isHit) {
    effect.opacity(0.5).missed();
  }

  // Optionally add sound
  if (context.soundEnabled) {
    seq.sound()
      .file('modules/intrinsics-sf2e-animation-framework/animations/ranged/laser_fire.ogg')
      .volume(context.soundVolume);
  }
}
```

The framework creates the `Sequence` and calls `.play()` after your function returns.
You just need to add effects and sounds to the sequence.

## Context Object

| Property       | Type    | Description                                      |
|----------------|---------|--------------------------------------------------|
| `sourceToken`  | Token   | The attacking token on the canvas                |
| `targetToken`  | Token   | The target token on the canvas                   |
| `isHit`        | boolean | Whether the attack roll hit                      |
| `scale`        | number  | Final scale (includes global multiplier)         |
| `speed`        | number  | Final speed in ms (includes global multiplier)   |
| `attackMode`   | string  | `'melee'` or `'ranged'`                          |
| `weaponInfo`   | object  | Full weapon metadata (group, category, range, damage, traits) |
| `soundVolume`  | number  | 0.0 to 1.0                                       |
| `soundEnabled` | boolean | Whether the user has sounds enabled              |

### WeaponInfo Object

| Property          | Type     | Description                                    |
|-------------------|----------|------------------------------------------------|
| `weaponGroup`     | string   | Weapon group: `laser`, `sword`, `plasma`, etc. |
| `weaponCategory`  | string   | Weapon category: `simple`, `martial`, etc.     |
| `range`           | number   | Range increment (null for melee)               |
| `primaryDamageType` | string | Damage type: `fire`, `slashing`, etc.          |
| `traits`          | string[] | Weapon traits array                            |
| `itemId`          | string   | Item UUID                                      |
| `itemName`        | string   | Display name                                   |

## Macro Override Format

When creating a Foundry macro to override an animation, the macro receives
the same context variables as scope:

```js
// Example Foundry Macro
const seq = new Sequence('intrinsics-sf2e-animation-framework');
seq.effect()
  .file('jb2a.fire_bolt.orange')
  .atLocation(sourceToken)
  .stretchTo(targetToken)
  .scale(scale)
  .speed(speed);

if (soundEnabled) {
  seq.sound()
    .file('path/to/custom_sound.ogg')
    .volume(soundVolume);
}

await seq.play();
```

## Directory Structure

```
animations/
├── ranged/              → Ranged weapon animations
│   ├── laser.js         → Laser weapon group
│   ├── plasma.js        → Plasma weapon group
│   ├── projectile.js    → Projectile/firearm/bow/crossbow/dart/sling
│   ├── flame.js         → Flame weapon group
│   ├── cryo.js          → Cryo weapon group
│   ├── shock.js         → Shock/electric weapon group
│   ├── sonic.js         → Sonic weapon group
│   ├── disintegrator.js → Disintegrator weapon group
│   └── disruption.js    → Disruption weapon group
├── melee/               → Melee weapon animations
│   ├── slash.js         → Sword, axe, knife groups
│   ├── strike.js        → Club, hammer, flail, shield groups
│   ├── thrust.js        → Polearm, spear, pick groups
│   └── brawling.js      → Brawling group / unarmed category
├── thrown/              → Thrown weapon animations
│   └── bomb.js          → Bomb/grenade weapon group
└── generic/             → Fallback animations
    └── generic.js       → Generic energy bolt fallback
```

## Melee vs Ranged Detection

Unlike SF1E which used action types (mwak/rwak), SF2E determines melee vs ranged
from the weapon's **range** field:

- `item.system.range` is `null` or `0` → **melee**
- `item.system.range` is a positive number → **ranged**

## JB2A Fallback

The default scripts use JB2A (Jules & Ben's Animated Assets) database paths.
If you have JB2A installed, the animations will work out of the box.
If not, the framework falls back to built-in JB2A path lookups.

You can replace any script with your own effects — use `.webm` files,
custom Sequencer database paths, or any other Sequencer-compatible source.
