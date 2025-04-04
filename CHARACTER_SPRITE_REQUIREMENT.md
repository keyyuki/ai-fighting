# Character Sprite Requirements

This document outlines the requirements for creating or sourcing character sprites for the 2D fighting game.

## General Requirements

- **File Format**: PNG with transparency
- **Character Size**:
  - Recommended Height: 200px
  - Recommended Width: 150px
- **Spritesheet Format**: Horizontal arrangement
- **Frame Consistency**: All frames should maintain consistent dimensions

## Required Animations

Each character requires the following animation states:

| Animation ID    | Description                 | Min Frames | Recommended Frames | Looping | Hitbox Data |
| --------------- | --------------------------- | ---------- | ------------------ | ------- | ----------- |
| `idle`          | Character standing still    | 4          | 8                  | Yes     | No          |
| `walk`          | Walking forward             | 6          | 8                  | Yes     | No          |
| `walk_back`     | Walking backward            | 6          | 8                  | Yes     | No          |
| `jump_start`    | Jump preparation            | 2          | 3                  | No      | No          |
| `jump`          | In-air (ascent and descent) | 2          | 4                  | Yes     | No          |
| `crouch`        | Crouching position          | 2          | 3                  | No      | No          |
| `block_high`    | Standing block stance       | 1          | 2                  | No      | No          |
| `block_low`     | Crouching block stance      | 1          | 2                  | No      | No          |
| `blockstun`     | Being hit while blocking    | 2          | 3                  | No      | No          |
| `attack_light`  | Light attack                | 4          | 6                  | No      | **Yes**     |
| `attack_medium` | Medium attack               | 6          | 8                  | No      | **Yes**     |
| `attack_heavy`  | Heavy attack                | 8          | 10                 | No      | **Yes**     |
| `hit`           | Getting hit animation       | 3          | 5                  | No      | No          |
| `knockdown`     | Knocked down animation      | 4          | 6                  | No      | No          |
| `guard_break`   | Guard broken animation      | 4          | 6                  | No      | No          |

## Optional Animations

| Animation ID | Description             | Recommended Frames | Looping | Hitbox Data |
| ------------ | ----------------------- | ------------------ | ------- | ----------- |
| `special1`   | Special move animation  | 12                 | No      | **Yes**     |
| `special2`   | Additional special move | 12                 | No      | **Yes**     |
| `victory`    | Victory pose            | 8                  | Yes     | No          |
| `defeat`     | Defeat animation        | 6                  | No      | No          |

## Collision Data Requirements

Each character requires three types of collision boxes:

1. **Pushbox**:

   - Purpose: Character-to-character collision
   - Visual Debug Color: rgba(0, 255, 0, 0.5) (green)
   - Required States:
     - Standing: Default position
     - Crouching: Lower height

2. **Hurtboxes**:

   - Purpose: Areas where the character can be hit
   - Visual Debug Color: rgba(0, 0, 255, 0.5) (blue)
   - Typical Configuration:
     - Standing: Separate boxes for torso and head
     - Crouching: Reduced area (usually just torso)

3. **Hitboxes**:
   - Purpose: Areas that deal damage to opponents
   - Visual Debug Color: rgba(255, 0, 0, 0.5) (red)
   - Required for:
     - All attack animations (light, medium, heavy)
     - Special move animations

## Animation Data Structure

For each character, you must provide a JSON file with the following structure:

```json
{
  "characterId": "character_id",
  "characterName": "Character Name",
  "spriteSheet": {
    "imageFile": "character_spritesheet.png",
    "frameWidth": 150,
    "frameHeight": 200,
    "defaultFrameDuration": 100
  },
  "animations": [
    {
      "id": "animation_id",
      "frames": [
        { "index": 0, "duration": 150 },
        { "index": 1, "duration": 150 }
        // Additional frames...
      ],
      "loop": true,
      "hitboxData": [
        // For attack animations only
        null, // No hitbox on this frame
        {
          "hitboxes": [
            {
              "x": 100,
              "y": 50,
              "width": 60,
              "height": 40
            }
          ],
          "damage": 5,
          "hitstun": 12,
          "blockstun": 8,
          "knockback": { "x": 3, "y": 1 }
        }
      ]
    }
    // Additional animations...
  ],
  "collisionBoxes": {
    "pushbox": {
      "standing": {
        /* dimensions */
      },
      "crouching": {
        /* dimensions */
      }
    },
    "hurtboxes": {
      "standing": [
        /* array of boxes */
      ],
      "crouching": [
        /* array of boxes */
      ]
    }
  },
  "animationState": {
    "jumpHeight": 150,
    "walkSpeed": 3,
    "specialMoves": [
      {
        "id": "special1",
        "inputSequence": ["DOWN", "DOWN_FORWARD", "FORWARD", "ATTACK_HEAVY"],
        "timeWindow": 500,
        "cancelableFrom": ["idle", "walk"]
      }
    ]
  }
}
```

## Attack Animation Structure

Attack animations should follow this frame structure:

1. **Startup Frames**: Initial preparation frames (no hitbox active)
2. **Active Frames**: Frames where the hitbox is active
3. **Recovery Frames**: End of the animation where character returns to neutral

Each active frame must define:

- Hitbox position and size
- Damage value
- Hitstun duration
- Blockstun duration
- Knockback vector

## Directory Structure

Place character assets in the following directory structure:

```
src/
  assets/
    characters/
      [character_id]/
        [character_id]_spritesheet.png
        [character_id]_animation_data.json
```

## Guidelines for Sprite Design

1. **Consistent Style**: All characters should share a consistent art style
2. **Clear Silhouettes**: Ensure characters have clear, readable silhouettes
3. **Attack Visibility**: Make attack animations clearly communicate their range
4. **Visual Hierarchy**: Important gameplay elements should be visually emphasized
5. **Animation Smoothness**: Frame transitions should be smooth and fluid
6. **Distinctive Animations**: Each move should be visually distinct

## Tools Recommendation

For creating character sprites:

- [Aseprite](https://www.aseprite.org/) (Recommended for pixel art)
- [Adobe Photoshop](https://www.adobe.com/products/photoshop.html) (For digital painting)
- [GIMP](https://www.gimp.org/) (Free alternative to Photoshop)

For creating spritesheets:

- [TexturePacker](https://www.codeandweb.com/texturepacker) (Spritesheet creation)
- [ShoeBox](https://renderhjs.net/shoebox/) (Free spritesheet tool)

## Additional Notes

- Ensure sufficient visual distinction between similar animations (e.g., attack_medium vs. attack_heavy)
- Plan animations considering both left and right-facing orientations
- Consider frame data balance (faster attacks should generally deal less damage)
- Include appropriate anticipation and follow-through in animations for gameplay feel
