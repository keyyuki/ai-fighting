/**
 * SpriteAnimationSystem.ts
 * Handles sprite-based animations for the game
 */

/**
 * Represents a single frame in an animation
 */
export interface AnimationFrame {
  /**
   * X position of the frame in the sprite sheet
   */
  x: number;

  /**
   * Y position of the frame in the sprite sheet
   */
  y: number;

  /**
   * Width of the frame
   */
  width: number;

  /**
   * Height of the frame
   */
  height: number;

  /**
   * Optional: Duration of this specific frame in milliseconds (overrides animation default)
   */
  duration?: number;

  /**
   * Optional: Offset X position for rendering
   */
  offsetX?: number;

  /**
   * Optional: Offset Y position for rendering
   */
  offsetY?: number;
}

/**
 * Configuration data for an animation sequence
 */
export interface AnimationConfig {
  /**
   * Name of the animation
   */
  name: string;

  /**
   * Frames that make up this animation
   */
  frames: AnimationFrame[];

  /**
   * Default duration for each frame (milliseconds)
   */
  frameDuration: number;

  /**
   * Whether the animation loops
   */
  loop: boolean;
}

/**
 * Represents a specific animation instance with current state
 */
export class Animation {
  private config: AnimationConfig;
  private currentFrameIndex: number = 0;
  private elapsedTime: number = 0;
  private finished: boolean = false;
  private onComplete?: () => void;
  private frameStartCallback?: (frameIndex: number) => void;

  /**
   * Creates a new Animation instance
   * @param config The animation configuration
   */
  constructor(config: AnimationConfig) {
    this.config = config;
  }

  /**
   * Get the current animation frame
   * @returns The current animation frame
   */
  public getCurrentFrame(): AnimationFrame {
    return this.config.frames[this.currentFrameIndex];
  }

  /**
   * Get the name of this animation
   * @returns The animation name
   */
  public getName(): string {
    return this.config.name;
  }

  /**
   * Check if the animation has finished
   * @returns True if the animation has reached the end and is not looping
   */
  public isFinished(): boolean {
    return this.finished;
  }

  /**
   * Set a callback to be called when the animation completes
   * @param callback The function to call when the animation completes
   */
  public setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }

  /**
   * Set a callback to be called when a new frame starts
   * @param callback The function to call when a new frame starts
   */
  public setFrameStartCallback(callback: (frameIndex: number) => void): void {
    this.frameStartCallback = callback;
  }

  /**
   * Update the animation state
   * @param deltaTime Time since last update in milliseconds
   */
  public update(deltaTime: number): void {
    if (this.finished) return;

    this.elapsedTime += deltaTime;

    // Get current frame's duration (use frame-specific or default)
    const currentFrame = this.getCurrentFrame();
    const frameDuration = currentFrame.duration || this.config.frameDuration;

    // Check if it's time to advance to the next frame
    if (this.elapsedTime >= frameDuration) {
      // Reset elapsed time, carrying over any excess time
      this.elapsedTime -= frameDuration;

      // Move to the next frame
      this.advanceFrame();
    }
  }

  /**
   * Move to the next frame in the animation
   */
  private advanceFrame(): void {
    const prevFrameIndex = this.currentFrameIndex;
    this.currentFrameIndex++;

    // Check if we've reached the end of the animation
    if (this.currentFrameIndex >= this.config.frames.length) {
      if (this.config.loop) {
        // Loop back to the beginning
        this.currentFrameIndex = 0;
      } else {
        // Stay on the last frame and mark as finished
        this.currentFrameIndex = this.config.frames.length - 1;
        this.finished = true;

        if (this.onComplete) {
          this.onComplete();
        }
      }
    }

    // If the frame actually changed, call the frame start callback
    if (prevFrameIndex !== this.currentFrameIndex && this.frameStartCallback) {
      this.frameStartCallback(this.currentFrameIndex);
    }
  }

  /**
   * Reset the animation to the beginning
   */
  public reset(): void {
    this.currentFrameIndex = 0;
    this.elapsedTime = 0;
    this.finished = false;
  }
}

/**
 * Manages sprite animations for the game
 */
export class SpriteAnimationSystem {
  private animations: Map<string, AnimationConfig> = new Map();
  private activeAnimations: Map<string, Animation> = new Map();
  private spriteSheets: Map<string, HTMLImageElement> = new Map();

  /**
   * Register an animation configuration
   * @param id Unique ID for this animation
   * @param config The animation configuration
   */
  public registerAnimation(id: string, config: AnimationConfig): void {
    this.animations.set(id, config);
  }

  /**
   * Register multiple animation configurations
   * @param animations Map of animation configurations
   */
  public registerAnimations(animations: Record<string, AnimationConfig>): void {
    Object.entries(animations).forEach(([id, config]) => {
      this.registerAnimation(id, config);
    });
  }

  /**
   * Load a sprite sheet image
   * @param id Unique ID for this sprite sheet
   * @param url URL to the sprite sheet image
   * @returns Promise that resolves when the image is loaded
   */
  public loadSpriteSheet(id: string, url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.spriteSheets.set(id, img);
        resolve(img);
      };
      img.onerror = () =>
        reject(new Error(`Failed to load sprite sheet: ${url}`));
      img.src = url;
    });
  }

  /**
   * Get a sprite sheet by ID
   * @param id ID of the sprite sheet
   * @returns The sprite sheet image or undefined if not found
   */
  public getSpriteSheet(id: string): HTMLImageElement | undefined {
    return this.spriteSheets.get(id);
  }

  /**
   * Play an animation for a specific entity
   * @param animationId ID of the animation to play
   * @param entityId ID of the entity playing the animation
   * @param resetIfSame Whether to reset if the same animation is already playing
   * @returns The animation instance or null if the animation wasn't found
   */
  public playAnimation(
    animationId: string,
    entityId: string,
    resetIfSame: boolean = false
  ): Animation | null {
    const config = this.animations.get(animationId);
    if (!config) return null;

    const currentAnimKey = `${entityId}:${animationId}`;

    // Check if this entity is already playing this animation
    const existingAnim = this.activeAnimations.get(currentAnimKey);
    if (existingAnim) {
      if (resetIfSame) {
        existingAnim.reset();
      }
      return existingAnim;
    }

    // Create a new animation instance
    const animation = new Animation(config);
    this.activeAnimations.set(currentAnimKey, animation);

    return animation;
  }

  /**
   * Stop an animation for a specific entity
   * @param animationId ID of the animation to stop
   * @param entityId ID of the entity
   */
  public stopAnimation(animationId: string, entityId: string): void {
    const key = `${entityId}:${animationId}`;
    this.activeAnimations.delete(key);
  }

  /**
   * Stop all animations for a specific entity
   * @param entityId ID of the entity
   */
  public stopAllEntityAnimations(entityId: string): void {
    // Find and remove all animations belonging to this entity
    const keysToRemove: string[] = [];

    this.activeAnimations.forEach((_, key) => {
      if (key.startsWith(`${entityId}:`)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((key) => {
      this.activeAnimations.delete(key);
    });
  }

  /**
   * Update all active animations
   * @param deltaTime Time since last update in milliseconds
   */
  public update(deltaTime: number): void {
    this.activeAnimations.forEach((animation) => {
      animation.update(deltaTime);

      // Remove finished non-looping animations
      if (animation.isFinished()) {
        const animName = animation.getName();
        // Note: We don't remove it here to avoid modifying the collection while iterating
        // Instead, we'll do a cleanup pass afterward if needed
      }
    });
  }

  /**
   * Render an animation for a specific entity
   * @param ctx Canvas rendering context
   * @param spriteSheetId ID of the sprite sheet to use
   * @param animationId ID of the animation to render
   * @param entityId ID of the entity
   * @param x X position to render at
   * @param y Y position to render at
   * @param flipX Whether to flip horizontally
   * @param flipY Whether to flip vertically
   * @param scale Scale factor (default: 1)
   */
  public renderAnimation(
    ctx: CanvasRenderingContext2D,
    spriteSheetId: string,
    animationId: string,
    entityId: string,
    x: number,
    y: number,
    flipX: boolean = false,
    flipY: boolean = false,
    scale: number = 1
  ): void {
    const spriteSheet = this.spriteSheets.get(spriteSheetId);
    if (!spriteSheet) return;

    const key = `${entityId}:${animationId}`;
    const animation = this.activeAnimations.get(key);
    if (!animation) return;

    const frame = animation.getCurrentFrame();

    // Save the current context state
    ctx.save();

    // Move to the position where we want to draw the sprite
    ctx.translate(x, y);

    // Apply scaling and flipping
    ctx.scale(flipX ? -scale : scale, flipY ? -scale : scale);

    // Draw the sprite at the origin (0,0) - the translate above puts it in the right place
    ctx.drawImage(
      spriteSheet,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      (flipX ? -1 : 0) * frame.width + (frame.offsetX || 0),
      (flipY ? -1 : 0) * frame.height + (frame.offsetY || 0),
      frame.width,
      frame.height
    );

    // Restore the context to its original state
    ctx.restore();
  }
}
