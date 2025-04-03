/**
 * AttackSystem.ts
 * Manages attack execution, combo detection, and frame data for fighting game characters
 */

import { Character } from "./Character";
import { InputManager } from "../../engine/input/InputManager";
import * as AudioService from "../../utils/audioService";
import {
  IAttackSystem,
  Attack,
  AttackPhase,
  SpecialMoveInput,
} from "./interface/IAttackSystem";

/**
 * Tracked input for special move detection
 */
interface InputHistoryEntry {
  /**
   * Input command (e.g. "up", "down", "punch", etc.)
   */
  input: string;

  /**
   * Timestamp when the input was pressed
   */
  timestamp: number;
}

/**
 * System that manages character attacks and combos
 */
export class AttackSystem implements IAttackSystem {
  /**
   * The character this system controls
   */
  private character: Character;

  /**
   * Available attacks
   */
  private attacks: Map<string, Attack> = new Map();

  /**
   * Current active attack
   */
  private currentAttack: Attack | null = null;

  /**
   * Current phase of the attack
   */
  private currentPhase: AttackPhase = AttackPhase.COMPLETED;

  /**
   * Timer for tracking attack phases (in milliseconds)
   */
  private phaseTimer: number = 0;

  /**
   * Damage scaling for combos (decreases damage on later hits)
   */
  private comboScaling: number = 1.0;

  /**
   * Current combo hit counter
   */
  private comboCounter: number = 0;

  /**
   * Timer for combo timeout
   */
  private comboTimer: number = 0;

  /**
   * Combo timeout in milliseconds (how long before combo resets)
   */
  private readonly COMBO_TIMEOUT: number = 1500;

  /**
   * Callback for when an attack phase changes
   */
  private onPhaseChangeCallback:
    | ((attack: Attack, phase: AttackPhase) => void)
    | null = null;

  /**
   * Input history for special move detection
   */
  private inputHistory: InputHistoryEntry[] = [];

  /**
   * How long to keep inputs in history (milliseconds)
   */
  private readonly INPUT_HISTORY_DURATION: number = 1000;

  /**
   * Reference to input manager
   */
  private inputManager: InputManager | null = null;

  /**
   * Create a new attack system
   * @param character The character this system controls
   */
  constructor(character: Character) {
    this.character = character;
  }

  /**
   * Set the input manager for detecting inputs
   * @param inputManager Input manager instance
   */
  public setInputManager(inputManager: InputManager): void {
    this.inputManager = inputManager;
  }

  /**
   * Register an attack
   * @param attack Attack definition
   */
  public registerAttack(attack: Attack): void {
    this.attacks.set(attack.name, attack);
  }

  /**
   * Register multiple attacks
   * @param attacks Array of attack definitions
   */
  public registerAttacks(attacks: Attack[]): void {
    attacks.forEach((attack) => this.registerAttack(attack));
  }

  /**
   * Update the attack system
   * @param deltaTime Time since last frame in milliseconds
   * @param inputsToCheck Inputs to check for attacks
   */
  public update(deltaTime: number, inputsToCheck?: string[]): void {
    // Update input history
    this.updateInputHistory();

    // Check for new attack inputs if we're not in the middle of one
    if (this.currentPhase === AttackPhase.COMPLETED && inputsToCheck) {
      // First check for special moves
      if (!this.checkSpecialMoves()) {
        // Then check for normal attacks
        this.checkNormalAttacks(inputsToCheck);
      }
    }

    // Update current attack phases
    this.updateAttackPhase(deltaTime);

    // Update combo state
    this.updateComboState(deltaTime);
  }

  /**
   * Update input history for special move detection
   */
  private updateInputHistory(): void {
    if (!this.inputManager) return;

    const currentTime = performance.now();

    // Record just pressed inputs
    for (const inputName of [
      "up",
      "down",
      "left",
      "right",
      "forward",
      "back",
      "attack_light",
      "attack_medium",
      "attack_heavy",
      "special_1",
      "special_2",
    ]) {
      if (this.inputManager.isJustPressed(inputName)) {
        this.inputHistory.push({
          input: inputName,
          timestamp: currentTime,
        });
      }
    }

    // Add directional combinations (down-forward, etc.)
    if (
      this.inputManager.isPressed("down") &&
      this.inputManager.isJustPressed("forward")
    ) {
      this.inputHistory.push({
        input: "down-forward",
        timestamp: currentTime,
      });
    }
    if (
      this.inputManager.isPressed("down") &&
      this.inputManager.isJustPressed("back")
    ) {
      this.inputHistory.push({
        input: "down-back",
        timestamp: currentTime,
      });
    }

    // Remove old inputs
    this.inputHistory = this.inputHistory.filter(
      (entry) => currentTime - entry.timestamp <= this.INPUT_HISTORY_DURATION
    );
  }

  /**
   * Check if any special move input sequences are matched
   * @returns True if a special move was found and executed
   */
  private checkSpecialMoves(): boolean {
    if (this.inputHistory.length === 0) return false;

    // Check each attack for special move inputs
    for (const [attackName, attack] of this.attacks.entries()) {
      if (!attack.specialMoveInput) continue;

      const sequence = attack.specialMoveInput.sequence;
      const timeWindow = attack.specialMoveInput.timeWindow;

      // Check if the sequence matches the most recent inputs
      if (this.matchesInputSequence(sequence, timeWindow)) {
        // Execute the special move
        this.executeAttack(attack);
        return true;
      }
    }

    return false;
  }

  /**
   * Check if input history matches a specific sequence within a time window
   * @param sequence The input sequence to match
   * @param timeWindow Time window in milliseconds
   * @returns True if the sequence was found in the input history
   */
  private matchesInputSequence(
    sequence: string[],
    timeWindow: number
  ): boolean {
    if (this.inputHistory.length < sequence.length) return false;

    // Get the relevant part of the history
    const recentInputs = this.inputHistory.slice(-sequence.length);

    // Check if the sequence matches
    for (let i = 0; i < sequence.length; i++) {
      if (recentInputs[i].input !== sequence[i]) {
        return false;
      }
    }

    // Check if the sequence was performed within the time window
    const firstInputTime = recentInputs[0].timestamp;
    const lastInputTime = recentInputs[recentInputs.length - 1].timestamp;

    return lastInputTime - firstInputTime <= timeWindow;
  }

  /**
   * Check for normal attack inputs
   * @param inputsToCheck Array of input names to check
   */
  private checkNormalAttacks(inputsToCheck: string[]): void {
    // Map from input names to attack types
    const inputToAttackType: { [key: string]: string } = {
      attack_light: "light",
      attack_medium: "medium",
      attack_heavy: "heavy",
    };

    // Check each input
    for (const input of inputsToCheck) {
      if (!this.inputManager?.isJustPressed(input)) continue;

      const attackType = inputToAttackType[input];
      if (!attackType) continue;

      // Find all attacks of this type
      const matchingAttacks = Array.from(this.attacks.values()).filter(
        (attack) => attack.type === attackType
      );

      // Choose appropriate attack based on character state
      let selectedAttack: Attack | null = null;

      // Is character in the air?
      const isInAir = !this.character.isOnGround();

      // Is character crouching?
      const isCrouching = this.character.isCrouching();

      // Filter attacks based on state
      if (isInAir) {
        selectedAttack = matchingAttacks.find((attack) => attack.canUseInAir);
      } else if (isCrouching) {
        selectedAttack = matchingAttacks.find(
          (attack) => attack.canUseWhileCrouching
        );
      } else {
        // Standing attack
        selectedAttack = matchingAttacks.find(
          (attack) => !attack.canUseInAir && !attack.canUseWhileCrouching
        );
      }

      // Use first matching attack as fallback
      if (!selectedAttack && matchingAttacks.length > 0) {
        selectedAttack = matchingAttacks[0];
      }

      // Execute the attack if found
      if (selectedAttack) {
        this.executeAttack(selectedAttack);
        break;
      }
    }
  }

  /**
   * Start executing an attack
   * @param attack The attack to execute
   * @returns True if the attack was successfully started
   */
  public executeAttack(attack: Attack): boolean {
    // Can't start a new attack if one is already in progress
    if (
      this.currentPhase !== AttackPhase.COMPLETED &&
      this.currentAttack?.canBeCanceled !== true
    ) {
      return false;
    }

    // Check if attack can be used in current state
    const isInAir = !this.character.isOnGround();
    const isCrouching = this.character.isCrouching();

    // FIX: Correct the aerial attack check - aerial attacks can only be used in the air
    if (attack.canUseInAir && !isInAir) {
      return false;
    }

    if (!isInAir && isCrouching && !attack.canUseWhileCrouching) {
      return false;
    }

    // Set current attack
    this.currentAttack = attack;
    this.currentPhase = AttackPhase.STARTUP;
    this.phaseTimer = attack.frameData.startup * 16.67; // Convert frames to milliseconds (assuming 60fps)

    // Notify phase change
    if (this.onPhaseChangeCallback) {
      this.onPhaseChangeCallback(attack, AttackPhase.STARTUP);
    }

    // Play sound effect if any
    if (attack.soundEffect) {
      AudioService.playSound(attack.soundEffect);
    }

    return true;
  }

  /**
   * Update the current attack phase
   * @param deltaTime Time since last frame in milliseconds
   */
  private updateAttackPhase(deltaTime: number): void {
    // No active attack
    if (this.currentPhase === AttackPhase.COMPLETED || !this.currentAttack)
      return;

    // Decrease phase timer
    this.phaseTimer -= deltaTime;

    // Check if phase is complete
    if (this.phaseTimer <= 0) {
      switch (this.currentPhase) {
        case AttackPhase.STARTUP:
          // Transition to active phase
          this.currentPhase = AttackPhase.ACTIVE;
          this.phaseTimer = this.currentAttack.frameData.active * 16.67;

          if (this.onPhaseChangeCallback) {
            this.onPhaseChangeCallback(this.currentAttack, AttackPhase.ACTIVE);
          }
          break;

        case AttackPhase.ACTIVE:
          // Transition to recovery phase
          this.currentPhase = AttackPhase.RECOVERY;
          this.phaseTimer = this.currentAttack.frameData.recovery * 16.67;

          if (this.onPhaseChangeCallback) {
            this.onPhaseChangeCallback(
              this.currentAttack,
              AttackPhase.RECOVERY
            );
          }
          break;

        case AttackPhase.RECOVERY:
          // Attack is complete
          this.completeAttack();
          break;
      }
    }
  }

  /**
   * Mark the current attack as complete
   */
  private completeAttack(): void {
    if (!this.currentAttack) return;

    this.currentPhase = AttackPhase.COMPLETED;

    if (this.onPhaseChangeCallback) {
      this.onPhaseChangeCallback(this.currentAttack, AttackPhase.COMPLETED);
    }

    this.currentAttack = null;
  }

  /**
   * Update combo state and scaling
   * @param deltaTime Time since last frame in milliseconds
   */
  private updateComboState(deltaTime: number): void {
    // If we have an active combo, update the timer
    if (this.comboCounter > 0) {
      this.comboTimer -= deltaTime;

      // Reset combo if timer expired
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }

  /**
   * Called when an attack successfully hits
   * @param defender The character that was hit
   */
  public onAttackHit(defender: Character): void {
    if (!this.currentAttack) return;

    // Increment combo count
    this.incrementCombo();

    // Apply hit effects
    this.applyHitEffects(defender);

    // Call the attack's onHit callback if any
    if (this.currentAttack.onHit) {
      this.currentAttack.onHit(this.character, defender);
    }
  }

  /**
   * Apply effects when an attack hits
   * @param defender The character that was hit
   */
  private applyHitEffects(defender: Character): void {
    if (!this.currentAttack) return;

    // Calculate damage with combo scaling
    const scaledDamage = Math.floor(
      this.currentAttack.frameData.damage * this.comboScaling
    );

    // Process hit on defender
    defender.takeDamage(
      scaledDamage,
      this.character,
      this.currentAttack.frameData
    );
  }

  /**
   * Increment the combo counter
   */
  public incrementCombo(): void {
    this.comboCounter++;
    this.comboTimer = this.COMBO_TIMEOUT;

    // Update damage scaling
    // Formula: 1.0 -> 0.5 scaling (minimum) as combo count increases
    this.comboScaling = Math.max(0.5, 1.0 - (this.comboCounter - 1) * 0.1);
  }

  /**
   * Reset the combo counter
   */
  public resetCombo(): void {
    this.comboCounter = 0;
    this.comboScaling = 1.0;
    this.comboTimer = 0;
  }

  /**
   * Get the current combo count
   */
  public getComboCount(): number {
    return this.comboCounter;
  }

  /**
   * Set callback for attack phase changes
   * @param callback Function to call when attack phases change
   */
  public setOnPhaseChangeCallback(
    callback: (attack: Attack, phase: AttackPhase) => void
  ): void {
    this.onPhaseChangeCallback = callback;
  }

  /**
   * Check if an attack is currently active
   */
  public isAttackActive(): boolean {
    return this.currentPhase !== AttackPhase.COMPLETED;
  }

  /**
   * Get the current attack
   */
  public getCurrentAttack(): Attack | null {
    return this.currentAttack;
  }

  /**
   * Get the current attack phase
   */
  public getCurrentPhase(): AttackPhase {
    return this.currentPhase;
  }

  /**
   * Calculate how far through the current phase we are (0.0 to 1.0)
   */
  public getPhaseProgress(): number {
    if (!this.currentAttack || this.currentPhase === AttackPhase.COMPLETED) {
      return 0;
    }

    let totalDuration;
    switch (this.currentPhase) {
      case AttackPhase.STARTUP:
        totalDuration = this.currentAttack.frameData.startup * 16.67;
        break;
      case AttackPhase.ACTIVE:
        totalDuration = this.currentAttack.frameData.active * 16.67;
        break;
      case AttackPhase.RECOVERY:
        totalDuration = this.currentAttack.frameData.recovery * 16.67;
        break;
      default:
        return 0;
    }

    // Calculate progress (1.0 = just started, 0.0 = about to end)
    return this.phaseTimer / totalDuration;
  }

  /**
   * Get an attack by its name
   * @param name The name of the attack to look up
   * @returns The attack definition or null if not found
   */
  public getAttackByName(name: string): Attack | null {
    return this.attacks.get(name) || null;
  }

  /**
   * Interrupt the current attack (e.g. when hit)
   */
  public interruptCurrentAttack(): void {
    if (this.currentPhase !== AttackPhase.COMPLETED) {
      this.completeAttack();
    }
  }
}
