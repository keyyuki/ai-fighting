# Background Stage Requirements

This document outlines the requirements for creating and implementing background stages for the 2D fighting game.

## General Requirements

- **File Format**: PNG with transparency where needed
- **Stage Dimensions**:
  - Width: 1280px (minimum)
  - Height: 720px (minimum)
- **Resolution**: Support for multiple resolutions (HD and above)
- **Parallax Layers**: Multiple background layers for depth effect
- **Responsive Design**: Ability to scale for different screen sizes

## Stage Structure

Each stage should consist of the following elements:

### 1. Background Layers (from back to front)

- **Far Background**: Distant scenery (sky, mountains, buildings)
- **Middle Background**: Mid-distance elements
- **Near Background**: Closer elements
- **Ground/Floor**: The platform where characters stand
- **Foreground**: Optional elements that appear in front of characters

### 2. Interactive Elements

- **Stage Boundaries**: Left and right boundaries
- **Floor Boundaries**: Ground collision line
- **Special Zones**: Optional areas that may have gameplay effects

### 3. Visual Effects

- **Ambient Animations**: Background animations that bring the stage to life
- **Lighting**: Different lighting conditions for atmosphere
- **Weather Effects**: Optional effects like rain, snow, etc.

## Required Stage Data

Each stage requires a JSON configuration file with the following structure:

```json
{
  "stageId": "stage_id",
  "stageName": "Stage Name",
  "description": "Brief description of the stage",
  "layers": [
    {
      "id": "far_background",
      "imageFile": "far_background.png",
      "parallaxFactor": 0.1,
      "position": { "x": 0, "y": 0 },
      "dimensions": { "width": 1280, "height": 720 },
      "animated": false
    },
    {
      "id": "middle_background",
      "imageFile": "middle_background.png",
      "parallaxFactor": 0.3,
      "position": { "x": 0, "y": 0 },
      "dimensions": { "width": 1280, "height": 720 },
      "animated": false
    },
    {
      "id": "near_background",
      "imageFile": "near_background.png",
      "parallaxFactor": 0.6,
      "position": { "x": 0, "y": 0 },
      "dimensions": { "width": 1280, "height": 720 },
      "animated": false
    },
    {
      "id": "floor",
      "imageFile": "floor.png",
      "parallaxFactor": 1.0,
      "position": { "x": 0, "y": 500 },
      "dimensions": { "width": 1280, "height": 220 },
      "animated": false
    },
    {
      "id": "foreground",
      "imageFile": "foreground.png",
      "parallaxFactor": 1.2,
      "position": { "x": 0, "y": 0 },
      "dimensions": { "width": 1280, "height": 720 },
      "animated": false,
      "opacity": 0.7
    }
  ],
  "animations": [
    {
      "layerId": "near_background",
      "animationData": {
        "frameWidth": 1280,
        "frameHeight": 720,
        "frames": 8,
        "frameRate": 12,
        "loop": true
      }
    }
  ],
  "boundaries": {
    "left": 100,
    "right": 1180,
    "floor": 500
  },
  "cameraSettings": {
    "followCharacters": true,
    "bounds": {
      "minX": 0,
      "maxX": 200
    },
    "smoothing": 0.1
  },
  "lighting": {
    "mainLight": { "r": 255, "g": 255, "b": 255, "intensity": 1.0 },
    "ambientLight": { "r": 200, "g": 200, "b": 220, "intensity": 0.3 }
  },
  "audio": {
    "backgroundMusic": "stage_theme.mp3",
    "ambientSounds": ["crowd.mp3", "wind.mp3"],
    "eventSounds": {
      "roundStart": "round_start.mp3",
      "roundEnd": "round_end.mp3"
    }
  }
}
```

## Animation Support

For animated backgrounds:

1. **Spritesheet Animation**:

   - Horizontal sprite sheet with consistent frame dimensions
   - Configurable frame rate and loop options

2. **Particle Effects**:
   - Support for particle systems (rain, leaves, dust)
   - Configurable particle properties (speed, direction, opacity)

## Design Guidelines

1. **Theme Consistency**: Each stage should have a coherent theme
2. **Visual Clarity**: The background should not interfere with gameplay visibility
3. **Contrast with Characters**: Ensure characters stand out against the background
4. **Performance Considerations**: Optimize image sizes and animations
5. **Unique Identity**: Each stage should have distinctive visual elements

## Minimal Stage Requirements

At minimum, each stage must include:

1. A static background image
2. A floor with collision data
3. Left and right boundaries
4. Basic lighting settings

## Recommended Stage Types

The game should include a variety of stage types such as:

1. **Urban**: City streets, rooftops, alleyways
2. **Natural**: Forests, beaches, mountains
3. **Interior**: Dojos, temples, arenas
4. **Fantasy**: Magical or surreal environments
5. **Technological**: Labs, futuristic settings

## Directory Structure

Place stage assets in the following directory structure:

```
src/
  assets/
    stages/
      [stage_id]/
        [stage_id]_far_background.png
        [stage_id]_middle_background.png
        [stage_id]_near_background.png
        [stage_id]_floor.png
        [stage_id]_foreground.png
        [stage_id]_config.json
  stages/
    Stage.ts                 # Base stage class
    StageManager.ts          # Stage management system
    [stage_id]/              # Individual stage implementations
      [StageId]Stage.ts
```

## Tools Recommendation

For creating stage artwork:

- [Adobe Photoshop](https://www.adobe.com/products/photoshop.html) or [GIMP](https://www.gimp.org/)
- [Aseprite](https://www.aseprite.org/) for pixel art stages
- [Affinity Designer](https://affinity.serif.com/designer/) for vector graphics

## Implementation Tips

1. Use parallax scrolling to create depth
2. Consider time of day variations for stages
3. Include subtle animations to make stages feel alive
4. Design stages to complement character visual styles
5. Optimize image assets for web performance
