/**
 * IBlockingSystem.ts
 * Interface for the blocking system used by fighting game characters
 */

import { Character } from "../Character";
import { Attack } from "../AttackSystem";

/**
 * Block types that affect what attacks can be blocked
 */
export enum BlockType {
  NONE,
  HIGH, // Standing block
  LOW, // Crouching block
}

/**
 * Configuration for the blocking system
 */
export interface BlockingConfig {
  // How much damage is reduced when blocking (0.0-1.0)
  damageReduction: number;
  // Maximum guard meter
  maxGuardMeter: number;
  // How fast guard meter recovers (per second)
  guardMeterRecoveryRate: number;
  // Guard meter damage on block (base value)
  guardMeterBlockDamage: number;
  // How long until guard meter starts recovering (ms)
  guardMeterRecoveryDelay: number;
  // Pushback when blocking (multiplier)
  blockPushbackMultiplier: number;
}

/**
 * Interface for the blocking system that manages character blocking mechanics
 */
export interface IBlockingSystem {
  /**
   * Update the blocking system
   * @param deltaTime Time since last frame in milliseconds
   */
  update(deltaTime: number): void;

  /**
   * Set the current blocking state
   * @param isBlocking Whether the character is blocking
   * @param isCrouching Whether the character is crouching
   */
  setBlocking(isBlocking: boolean, isCrouching: boolean): void;

  /**
   * Check if an attack can be blocked with the current block type
   * @param attack The attack to check
   * @returns Whether the attack can be blocked
   */
  canBlockAttack(attack: Attack): boolean;

  /**
   * Process a blocked attack
   * @param attack The attack that was blocked
   * @param attacker The character who performed the attack
   * @returns The amount of damage that got through the block
   */
  processBlock(attack: Attack, attacker: Character): number;

  /**
   * Check if character is currently blocking
   */
  getIsBlocking(): boolean;

  /**
   * Get current block type
   */
  getBlockType(): BlockType;

  /**
   * Get current guard meter value
   */
  getGuardMeter(): number;

  /**
   * Get guard meter as percentage (0-100%)
   */
  getGuardMeterPercentage(): number;

  /**
   * Reset guard meter to max
   */
  resetGuardMeter(): void;
}
