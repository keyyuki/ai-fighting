/**
 * IStageManager.ts
 * Interface for the stage manager, which handles loading and switching between stages.
 */

import { IStage, StageConfig } from "./IStage";

/**
 * Interface for the stage manager
 */
export interface IStageManager {
  /**
   * Load all available stages
   */
  loadStages(): Promise<void>;

  /**
   * Get a specific stage by ID
   * @param stageId The ID of the stage to retrieve
   */
  getStage(stageId: string): IStage | undefined;

  /**
   * Get all loaded stages
   */
  getAllStages(): IStage[];

  /**
   * Get the currently active stage
   */
  getCurrentStage(): IStage | undefined;

  /**
   * Set the active stage
   * @param stageId The ID of the stage to set as active
   */
  setCurrentStage(stageId: string): Promise<boolean>;

  /**
   * Create a new stage from a configuration object
   * @param config The stage configuration
   */
  createStage(config: StageConfig): IStage;

  /**
   * Register a new stage with the manager
   * @param stage The stage to register
   */
  registerStage(stage: IStage): void;

  /**
   * Unregister a stage from the manager
   * @param stageId The ID of the stage to unregister
   */
  unregisterStage(stageId: string): boolean;

  /**
   * Check if a stage with the specified ID exists
   * @param stageId The ID to check
   */
  hasStage(stageId: string): boolean;
}
