/**
 * IDamageScalingSystem.ts
 * Interface for damage scaling system in fighting games
 */

import { Attack } from "./IAttackSystem";

/**
 * Scaling factors for different attack types
 */
export interface AttackTypeScalingFactors {
  [key: string]: number;
}

/**
 * Configuration for damage scaling
 */
export interface DamageScalingConfig {
  /**
   * Base scaling factor applied to all combos
   */
  baseScalingFactor: number;

  /**
   * Minimum scaling percentage (0.0 to 1.0) that damage can be reduced to
   */
  minimumScalingPercentage: number;

  /**
   * Additional scaling per hit in a combo
   */
  scalingPerHit: number;

  /**
   * Maximum combo hits before forced scaling to minimum
   */
  maxScalingHits: number;

  /**
   * Scaling factors for different attack types
   */
  attackTypeScalingFactors: AttackTypeScalingFactors;

  /**
   * Whether to apply additional scaling to repeated moves
   */
  applyRepeatedMoveScaling: boolean;

  /**
   * Additional scaling factor for repeated moves
   */
  repeatedMoveScalingFactor: number;
}

/**
 * Interface for the damage scaling system
 */
export interface IDamageScalingSystem {
  /**
   * Set custom damage scaling configuration
   * @param config New configuration (partial or complete)
   */
  setConfig(config: Partial<DamageScalingConfig>): void;

  /**
   * Get the current damage scaling configuration
   */
  getConfig(): DamageScalingConfig;

  /**
   * Calculate scaled damage based on combo state
   * @param rawDamage The raw damage value
   * @param comboLength Current combo length
   * @param attack The attack being used
   * @param attackHistory Previous attacks in the combo
   * @returns The scaled damage value
   */
  calculateScaledDamage(
    rawDamage: number,
    comboLength: number,
    attack: Attack,
    attackHistory?: Attack[]
  ): number;

  /**
   * Reset the scaling system (end of combo)
   */
  reset(): void;

  /**
   * Get the current scaling factor (for UI display)
   */
  getCurrentScalingFactor(): number;

  /**
   * Apply a temporary damage modifier (e.g., for special conditions)
   * @param modifierId Unique identifier for this modifier
   * @param factor The scaling factor to apply
   * @param duration Duration in frames (or -1 for permanent)
   */
  applyTemporaryModifier(
    modifierId: string,
    factor: number,
    duration: number
  ): void;

  /**
   * Remove a temporary damage modifier
   * @param modifierId Identifier of the modifier to remove
   */
  removeTemporaryModifier(modifierId: string): void;
}
