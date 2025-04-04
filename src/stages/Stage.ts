/**
 * Stage.ts
 * Implementation of the base Stage class for rendering and managing the game's background
 */

import {
  IStage,
  StageConfig,
  StageLayer,
  StageBoundaries,
  StageAnimationData,
} from "./interface/IStage";
import { Vector2D } from "../engine/physics/CollisionSystem";
import { loadImage } from "../utils/assetLoader";
import * as audioService from "../utils/audioService";

/**
 * Base Stage class that implements the IStage interface
 */
export class Stage implements IStage {
  private config: StageConfig;
  private layers: StageLayer[] = [];
  private boundaries: StageBoundaries;
  private images: Map<string, HTMLImageElement> = new Map();
  private animations?: { layerId: string; animationData: StageAnimationData }[];
  private animationTimers: Map<string, number> = new Map();
  private initialized = false;

  /**
   * Create a new Stage instance
   * @param config Configuration data for the stage
   */
  constructor(config: StageConfig) {
    this.config = config;
    this.layers = [...config.layers];
    this.boundaries = { ...config.boundaries };

    // Set up animations if they exist
    if (config.animations) {
      this.animations = config.animations.map((anim) => ({
        layerId: anim.layerId,
        animationData: {
          ...anim.animationData,
          currentFrame: 0,
        },
      }));
    }
  }

  /**
   * Get the unique identifier for this stage
   */
  public getId(): string {
    return this.config.stageId;
  }

  /**
   * Get the display name of this stage
   */
  public getName(): string {
    return this.config.stageName;
  }

  /**
   * Get the description of this stage
   */
  public getDescription(): string {
    return this.config.description;
  }

  /**
   * Initialize the stage, loading all required assets
   */
  public async initialize(): Promise<void> {
    // Load all images for each layer
    const imagePromises = this.layers.map(async (layer) => {
      try {
        // Assume images are stored in a directory structure like:
        // src/assets/stages/[stage_id]/[image_file]
        const path = `src/assets/stages/${this.getId()}/${layer.imageFile}`;
        const image = await loadImage(path);
        this.images.set(layer.id, image);
      } catch (error) {
        console.error(`Failed to load image for layer ${layer.id}:`, error);
        // Create a placeholder colorful rectangle for missing images
        const canvas = document.createElement("canvas");
        canvas.width = layer.dimensions.width;
        canvas.height = layer.dimensions.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 70%)`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.font = "24px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            `Missing: ${layer.imageFile}`,
            canvas.width / 2,
            canvas.height / 2
          );

          // Convert canvas to image
          const img = new Image();
          img.src = canvas.toDataURL();
          this.images.set(layer.id, img);
        }
      }
    });

    await Promise.all(imagePromises);
    this.initialized = true;
  }

  /**
   * Update stage animations and effects
   * @param deltaTime Time elapsed since last update in milliseconds
   */
  public update(deltaTime: number): void {
    if (!this.initialized || !this.animations) return;

    // Update each animation
    for (const anim of this.animations) {
      const { layerId, animationData } = anim;

      // Skip if layer doesn't exist or isn't animated
      const layer = this.getLayer(layerId);
      if (!layer || !layer.animated) continue;

      // Calculate frame advancement
      const frameTime = 1000 / animationData.frameRate; // ms per frame

      // Get or initialize timer
      let timer = this.animationTimers.get(layerId) || 0;
      timer += deltaTime;

      // Check if we need to advance the frame
      if (timer >= frameTime) {
        // Advance frame
        animationData.currentFrame = (animationData.currentFrame || 0) + 1;

        // Loop if necessary
        if (animationData.currentFrame >= animationData.frames) {
          animationData.currentFrame = animationData.loop
            ? 0
            : animationData.frames - 1;
        }

        // Reset timer accounting for overflow
        timer = timer % frameTime;
      }

      // Update timer
      this.animationTimers.set(layerId, timer);
    }
  }

  /**
   * Render the stage to the provided context
   * @param ctx Canvas rendering context
   * @param cameraOffset Current camera offset for parallax
   */
  public render(ctx: CanvasRenderingContext2D, cameraOffset: Vector2D): void {
    if (!this.initialized) return;

    // Sort layers by parallax factor to ensure proper draw order
    const sortedLayers = [...this.layers].sort(
      (a, b) => a.parallaxFactor - b.parallaxFactor
    );

    // Draw each layer
    for (const layer of sortedLayers) {
      // Skip if layer is not visible
      if (layer.visible === false) continue;

      // Get the image for this layer
      const image = this.images.get(layer.id);
      if (!image) continue;

      // Apply parallax effect
      const parallaxOffset = {
        x: cameraOffset.x * layer.parallaxFactor,
        y: cameraOffset.y * layer.parallaxFactor,
      };

      // Set opacity if specified
      const prevAlpha = ctx.globalAlpha;
      if (layer.opacity !== undefined) {
        ctx.globalAlpha = layer.opacity;
      }

      // Save context state
      ctx.save();

      // Apply translation for parallax
      ctx.translate(-parallaxOffset.x, -parallaxOffset.y);

      // Draw animated layers differently
      if (layer.animated && this.animations) {
        const animation = this.animations.find((a) => a.layerId === layer.id);
        if (animation) {
          const { animationData } = animation;
          const frameIndex = animationData.currentFrame || 0;

          // Calculate source rectangle from spritesheet
          const srcX = frameIndex * animationData.frameWidth;

          // Draw the current frame from the spritesheet
          ctx.drawImage(
            image,
            srcX,
            0,
            animationData.frameWidth,
            animationData.frameHeight,
            layer.position.x,
            layer.position.y,
            layer.dimensions.width,
            layer.dimensions.height
          );
        }
      } else {
        // Draw static image
        ctx.drawImage(
          image,
          layer.position.x,
          layer.position.y,
          layer.dimensions.width,
          layer.dimensions.height
        );
      }

      // Restore context state
      ctx.restore();

      // Reset opacity
      ctx.globalAlpha = prevAlpha;
    }
  }

  /**
   * Get the stage boundaries for collision detection
   */
  public getBoundaries(): StageBoundaries {
    return { ...this.boundaries };
  }

  /**
   * Get a specific layer from the stage
   * @param layerId The ID of the layer to retrieve
   */
  public getLayer(layerId: string): StageLayer | undefined {
    return this.layers.find((layer) => layer.id === layerId);
  }

  /**
   * Get all stage layers
   */
  public getLayers(): StageLayer[] {
    return [...this.layers];
  }

  /**
   * Get the floor Y position for character positioning
   */
  public getFloorY(): number {
    return this.boundaries.floor;
  }

  /**
   * Play the stage background music
   */
  public playMusic(): void {
    if (this.config.audio?.backgroundMusic) {
      audioService.playMusic(this.config.audio.backgroundMusic);
    }
  }

  /**
   * Stop the stage background music
   */
  public stopMusic(): void {
    audioService.stopMusic();
  }

  /**
   * Play a specific ambient sound
   * @param soundId The ID of the sound to play
   */
  public playAmbientSound(soundId: string): void {
    if (!this.config.audio?.ambientSounds) return;

    const soundFile = this.config.audio.ambientSounds.find((sound) =>
      sound.includes(soundId)
    );

    if (soundFile) {
      audioService.playSound(soundFile);
    }
  }

  /**
   * Play an event-specific sound
   * @param eventName The name of the event
   */
  public playEventSound(eventName: string): void {
    if (!this.config.audio?.eventSounds) return;

    const soundFile = this.config.audio.eventSounds[eventName];
    if (soundFile) {
      audioService.playSound(soundFile);
    }
  }
}
