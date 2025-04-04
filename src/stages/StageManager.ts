/**
 * StageManager.ts
 * Implementation of the StageManager class for managing game stages
 */

import { IStageManager } from "./interface/IStageManager";
import { IStage, StageConfig } from "./interface/IStage";
import { Stage } from "./Stage";

/**
 * StageManager class for managing all game stages
 */
export class StageManager implements IStageManager {
  private stages: Map<string, IStage> = new Map();
  private currentStageId?: string;

  /**
   * Create a new StageManager
   */
  constructor() {}

  /**
   * Load all available stages from config files
   */
  public async loadStages(): Promise<void> {
    try {
      // Load stage configs from files
      const stageConfigs = await this.loadStageConfigs();

      // Create and register each stage
      stageConfigs.forEach((config) => {
        const stage = this.createStage(config);
        this.registerStage(stage);
      });

      console.log(`Loaded ${stageConfigs.length} stages`);
    } catch (error) {
      console.error("Failed to load stages:", error);
      throw error;
    }
  }

  /**
   * Load stage configuration files
   * @private
   */
  private async loadStageConfigs(): Promise<StageConfig[]> {
    // Get list of available stage directories
    const stageDirs = ["dojo", "street"]; // Hardcoded for now, could be dynamic
    const configs: StageConfig[] = [];

    // Load config for each stage
    for (const stageId of stageDirs) {
      try {
        // In a real implementation, this would load from a file
        // For now, we'll create configs programmatically
        const config = await this.generateMockStageConfig(stageId);
        configs.push(config);
      } catch (error) {
        console.error(`Failed to load config for stage ${stageId}:`, error);
      }
    }

    return configs;
  }

  /**
   * Generate a mock stage configuration for testing
   * In a real implementation, this would load from a JSON file
   * @param stageId The ID of the stage to create a config for
   * @private
   */
  private async generateMockStageConfig(stageId: string): Promise<StageConfig> {
    if (stageId === "dojo") {
      return {
        stageId: "dojo",
        stageName: "Training Dojo",
        description: "A peaceful dojo for intense training",
        layers: [
          {
            id: "far_background",
            imageFile: "dojo_far_background.png",
            position: { x: 0, y: 0 },
            dimensions: { width: 1280, height: 720 },
            parallaxFactor: 0.1,
            animated: false,
          },
          {
            id: "middle_background",
            imageFile: "dojo_middle_background.png",
            position: { x: 0, y: 100 },
            dimensions: { width: 1280, height: 620 },
            parallaxFactor: 0.3,
            animated: false,
          },
          {
            id: "floor",
            imageFile: "dojo_floor.png",
            position: { x: 0, y: 500 },
            dimensions: { width: 1280, height: 220 },
            parallaxFactor: 1.0,
            animated: false,
          },
        ],
        boundaries: {
          left: 100,
          right: 1180,
          floor: 500,
        },
        audio: {
          backgroundMusic: "dojo_theme.mp3",
          ambientSounds: ["wind.mp3", "birds.mp3"],
          eventSounds: {
            roundStart: "gong.mp3",
            roundEnd: "applause.mp3",
          },
        },
      };
    } else if (stageId === "street") {
      return {
        stageId: "street",
        stageName: "Urban Street",
        description: "A gritty urban street at night",
        layers: [
          {
            id: "far_background",
            imageFile: "street_far_background.png",
            position: { x: 0, y: 0 },
            dimensions: { width: 1280, height: 720 },
            parallaxFactor: 0.1,
            animated: false,
          },
          {
            id: "buildings",
            imageFile: "street_buildings.png",
            position: { x: 0, y: 50 },
            dimensions: { width: 1280, height: 400 },
            parallaxFactor: 0.2,
            animated: false,
          },
          {
            id: "street_lights",
            imageFile: "street_lights.png",
            position: { x: 0, y: 100 },
            dimensions: { width: 1280, height: 500 },
            parallaxFactor: 0.4,
            animated: true,
          },
          {
            id: "floor",
            imageFile: "street_floor.png",
            position: { x: 0, y: 500 },
            dimensions: { width: 1280, height: 220 },
            parallaxFactor: 1.0,
            animated: false,
          },
          {
            id: "foreground",
            imageFile: "street_foreground.png",
            position: { x: 0, y: 550 },
            dimensions: { width: 1280, height: 170 },
            parallaxFactor: 1.2,
            animated: false,
            opacity: 0.7,
          },
        ],
        animations: [
          {
            layerId: "street_lights",
            animationData: {
              layerId: "street_lights",
              frameWidth: 1280,
              frameHeight: 500,
              frames: 4,
              frameRate: 4,
              loop: true,
            },
          },
        ],
        boundaries: {
          left: 100,
          right: 1180,
          floor: 500,
        },
        lighting: {
          mainLight: { r: 100, g: 100, b: 150, intensity: 0.8 },
          ambientLight: { r: 50, g: 50, b: 80, intensity: 0.4 },
        },
        audio: {
          backgroundMusic: "street_theme.mp3",
          ambientSounds: ["traffic.mp3", "crowd.mp3"],
          eventSounds: {
            roundStart: "bell.mp3",
            roundEnd: "cheers.mp3",
          },
        },
        cameraSettings: {
          followCharacters: true,
          bounds: { minX: 0, maxX: 200 },
          smoothing: 0.1,
        },
      };
    } else {
      throw new Error(`Unknown stage ID: ${stageId}`);
    }
  }

  /**
   * Create a stage from a configuration object
   * @param config The stage configuration
   */
  public createStage(config: StageConfig): IStage {
    return new Stage(config);
  }

  /**
   * Get a specific stage by ID
   * @param stageId The ID of the stage to retrieve
   */
  public getStage(stageId: string): IStage | undefined {
    return this.stages.get(stageId);
  }

  /**
   * Get all loaded stages
   */
  public getAllStages(): IStage[] {
    return Array.from(this.stages.values());
  }

  /**
   * Get the currently active stage
   */
  public getCurrentStage(): IStage | undefined {
    return this.currentStageId ? this.getStage(this.currentStageId) : undefined;
  }

  /**
   * Set the active stage
   * @param stageId The ID of the stage to set as active
   */
  public async setCurrentStage(stageId: string): Promise<boolean> {
    const stage = this.getStage(stageId);
    if (!stage) {
      console.error(`Stage with ID ${stageId} not found`);
      return false;
    }

    // Stop music from previous stage if there was one
    const currentStage = this.getCurrentStage();
    if (currentStage) {
      currentStage.stopMusic();
    }

    // Initialize the stage if not already initialized
    await stage.initialize();

    // Set as current stage
    this.currentStageId = stageId;

    // Play the stage music
    stage.playMusic();

    return true;
  }

  /**
   * Register a new stage with the manager
   * @param stage The stage to register
   */
  public registerStage(stage: IStage): void {
    const stageId = stage.getId();
    if (this.stages.has(stageId)) {
      throw new Error(`Stage with ID ${stageId} is already registered`);
    }

    this.stages.set(stageId, stage);
  }

  /**
   * Unregister a stage from the manager
   * @param stageId The ID of the stage to unregister
   */
  public unregisterStage(stageId: string): boolean {
    // Check if this is the current stage
    if (stageId === this.currentStageId) {
      // Reset current stage
      this.currentStageId = undefined;
    }

    // Remove from stages map
    return this.stages.delete(stageId);
  }

  /**
   * Check if a stage with the specified ID exists
   * @param stageId The ID to check
   */
  public hasStage(stageId: string): boolean {
    return this.stages.has(stageId);
  }
}
