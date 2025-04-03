/**
 * IAttackSystem.ts
 * Interface for attack system used by fighting game characters
 */

import { InputManager } from "../../../engine/input/InputManager";
import { Character } from "../Character";
import { Vector2D } from "../../../engine/physics/CollisionSystem";

/**
 * Attack phase states
 */
export enum AttackPhase {
  STARTUP,
  ACTIVE,
  RECOVERY,
  COMPLETED,
}

/**
 * Special move input requirement
 */
export interface SpecialMoveInput {
  /**
   * Sequence of inputs required (e.g. ["down", "down-forward", "forward", "punch"])
   */
  sequence: string[];

  /**
   * Maximum time window in milliseconds to complete the sequence
   */
  timeWindow: number;
}

/**
 * Represents an attack with complete frame data
 */
export interface Attack {
  /**
   * Name of the attack
   */
  name: string;

  /**
   * Type of attack (light, medium, heavy, special, etc.)
   */
  type: string;

  /**
   * Frame data (timing, damage, etc.)
   */
  frameData: AttackFrameData;

  /**
   * Can this attack be canceled into other attacks
   */
  canBeCanceled: boolean;

  /**
   * Sound effect to play when attack is executed
   */
  soundEffect?: string;

  /**
   * Animation ID for this attack
   */
  animationId: string;

  /**
   * Special move input sequence (if applicable)
   */
  specialMoveInput?: SpecialMoveInput;

  /**
   * Whether this attack can be performed in the air
   */
  canUseInAir: boolean;

  /**
   * Whether this attack can be performed while crouching
   */
  canUseWhileCrouching: boolean;

  /**
   * Callback to execute when the attack hits
   */
  onHit?: (attacker: Character, defender: Character) => void;

  /**
   * Whether this attack is unblockable
   */
  unblockable?: boolean;

  /**
   * Whether this attack must be blocked low (e.g. sweeps)
   */
  mustBlockLow?: boolean;

  /**
   * Whether this attack must be blocked high (e.g. jump attacks)
   */
  mustBlockHigh?: boolean;
}

/**
 * Frame data for an attack
 */
export interface AttackFrameData {
  /**
   * Startup frames (before attack becomes active)
   */
  startup: number;

  /**
   * Active frames (when attack can hit)
   */
  active: number;

  /**
   * Recovery frames (after active frames, before next action)
   */
  recovery: number;

  /**
   * Hitstun frames (how long hit character is stunned)
   */
  hitstun: number;

  /**
   * Blockstun frames (how long blocking character is stunned)
   */
  blockstun: number;

  /**
   * Damage dealt by the attack
   */
  damage: number;

  /**
   * Knockback force on hit
   */
  knockback: Vector2D;
}

/**
 * Interface for the attack system that manages character attacks and combos
 */
export interface IAttackSystem {
  /**
   * Set the input manager for detecting inputs
   * @param inputManager Input manager instance
   */
  setInputManager(inputManager: InputManager): void;

  /**
   * Register an attack
   * @param attack Attack definition
   */
  registerAttack(attack: Attack): void;

  /**
   * Register multiple attacks
   * @param attacks Array of attack definitions
   */
  registerAttacks(attacks: Attack[]): void;

  /**
   * Update the attack system
   * @param deltaTime Time since last frame in milliseconds
   * @param inputsToCheck Inputs to check for attacks
   */
  update(deltaTime: number, inputsToCheck?: string[]): void;

  /**
   * Start executing an attack
   * @param attack The attack to execute
   * @returns True if the attack was successfully started
   */
  executeAttack(attack: Attack): boolean;

  /**
   * Called when an attack successfully hits
   * @param defender The character that was hit
   */
  onAttackHit(defender: Character): void;

  /**
   * Increment the combo counter
   */
  incrementCombo(): void;

  /**
   * Reset the combo counter
   */
  resetCombo(): void;

  /**
   * Get the current combo count
   */
  getComboCount(): number;

  /**
   * Set callback for attack phase changes
   * @param callback Function to call when attack phases change
   */
  setOnPhaseChangeCallback(
    callback: (attack: Attack, phase: AttackPhase) => void
  ): void;

  /**
   * Check if an attack is currently active
   */
  isAttackActive(): boolean;

  /**
   * Get the current attack
   */
  getCurrentAttack(): Attack | null;

  /**
   * Get the current attack phase
   */
  getCurrentPhase(): AttackPhase;

  /**
   * Calculate how far through the current phase we are (0.0 to 1.0)
   */
  getPhaseProgress(): number;

  /**
   * Interrupt the current attack (e.g. when hit)
   */
  interruptCurrentAttack(): void;

  /**
   * Get an attack by its name
   * @param name The name of the attack to look up
   * @returns The attack definition or null if not found
   */
  getAttackByName(name: string): Attack | null;
}
