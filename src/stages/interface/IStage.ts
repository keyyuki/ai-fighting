/**
 * IStage.ts
 * Interface for game stages. Defines the contract for all stage implementations.
 */

import { Vector2D } from "../../engine/physics/CollisionSystem";

/**
 * Represents a layer in the stage background
 */
export interface StageLayer {
  id: string;
  imageFile: string;
  position: Vector2D;
  dimensions: {
    width: number;
    height: number;
  };
  parallaxFactor: number;
  animated: boolean;
  opacity?: number;
  visible?: boolean;
}

/**
 * Animation data for animated stage backgrounds
 */
export interface StageAnimationData {
  layerId: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  frameRate: number;
  loop: boolean;
  currentFrame?: number;
}

/**
 * Stage boundaries for character movement and collision
 */
export interface StageBoundaries {
  left: number;
  right: number;
  floor: number;
}

/**
 * Camera settings for stage view
 */
export interface CameraSettings {
  followCharacters: boolean;
  bounds: {
    minX: number;
    maxX: number;
  };
  smoothing: number;
}

/**
 * Lighting configuration for the stage
 */
export interface StageLighting {
  mainLight: {
    r: number;
    g: number;
    b: number;
    intensity: number;
  };
  ambientLight: {
    r: number;
    g: number;
    b: number;
    intensity: number;
  };
}

/**
 * Audio settings for the stage
 */
export interface StageAudio {
  backgroundMusic: string;
  ambientSounds?: string[];
  eventSounds?: {
    [key: string]: string;
  };
}

/**
 * Configuration data for a stage
 */
export interface StageConfig {
  stageId: string;
  stageName: string;
  description: string;
  layers: StageLayer[];
  animations?: {
    layerId: string;
    animationData: StageAnimationData;
  }[];
  boundaries: StageBoundaries;
  cameraSettings?: CameraSettings;
  lighting?: StageLighting;
  audio?: StageAudio;
}

/**
 * Interface for game stages
 */
export interface IStage {
  /**
   * Get the unique identifier for this stage
   */
  getId(): string;

  /**
   * Get the display name of this stage
   */
  getName(): string;

  /**
   * Get the description of this stage
   */
  getDescription(): string;

  /**
   * Initialize the stage, loading assets and preparing for use
   */
  initialize(): Promise<void>;

  /**
   * Update stage animations and effects
   * @param deltaTime Time elapsed since last update in milliseconds
   */
  update(deltaTime: number): void;

  /**
   * Render the stage to the provided context
   * @param ctx Canvas rendering context
   * @param cameraOffset Current camera offset for parallax
   */
  render(ctx: CanvasRenderingContext2D, cameraOffset: Vector2D): void;

  /**
   * Get the stage boundaries for collision detection
   */
  getBoundaries(): StageBoundaries;

  /**
   * Get a specific layer from the stage
   * @param layerId The ID of the layer to retrieve
   */
  getLayer(layerId: string): StageLayer | undefined;

  /**
   * Get all stage layers
   */
  getLayers(): StageLayer[];

  /**
   * Get the floor Y position for character positioning
   */
  getFloorY(): number;

  /**
   * Play the stage background music
   */
  playMusic(): void;

  /**
   * Stop the stage background music
   */
  stopMusic(): void;

  /**
   * Play a specific ambient sound
   * @param soundId The ID of the sound to play
   */
  playAmbientSound(soundId: string): void;

  /**
   * Play an event-specific sound
   * @param eventName The name of the event
   */
  playEventSound(eventName: string): void;
}
