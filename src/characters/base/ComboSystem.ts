/**
 * ComboSystem.ts
 * Manages combo detection, tracking, and evaluation for the fighting game
 */

import { Character } from "./Character";
import { AttackSystem, AttackPhase, Attack } from "./AttackSystem";
import { UIManager } from "../../ui/UIManager";
import { DamageScalingSystem } from "./DamageScalingSystem";
import { DamageScalingConfig } from "./interface/IDamageScalingSystem";

/**
 * Combo timing constraints in milliseconds
 */
export interface ComboTimingConfig {
  /**
   * Maximum time between hits to maintain a combo
   */
  maxTimeBetweenHits: number;

  /**
   * Time to allow canceling one move into another
   */
  cancelWindow: number;

  /**
   * Maximum time to input the next move after recovery
   */
  linkWindow: number;
}

/**
 * Types of combo connections
 */
export enum ComboConnectionType {
  /**
   * Canceling a move before recovery into another move
   */
  CANCEL,

  /**
   * Linking one move after its recovery into another move
   */
  LINK,

  /**
   * A chain where specific moves can be connected in sequence
   */
  CHAIN,

  /**
   * Special/unique combo transitions (character specific)
   */
  SPECIAL,
}

/**
 * Records information about a hit in a combo
 */
export interface ComboHit {
  /**
   * Attack that landed
   */
  attackName: string;

  /**
   * Raw damage before scaling
   */
  rawDamage: number;

  /**
   * Actual damage after scaling
   */
  scaledDamage: number;

  /**
   * How this hit connected to the previous one
   */
  connectionType: ComboConnectionType;

  /**
   * Timestamp when the hit landed
   */
  timestamp: number;

  /**
   * Current scaling factor when this hit occurred
   */
  scalingFactor: number;
}

/**
 * Manages combo detection, tracking and evaluation
 */
export class ComboSystem {
  /**
   * Character that owns this combo system
   */
  private character: Character;

  /**
   * Reference to the character's attack system
   */
  private attackSystem: AttackSystem;

  /**
   * UI Manager reference for displaying combos
   */
  private uiManager: UIManager | null = null;

  /**
   * Current active combo hits
   */
  private currentCombo: ComboHit[] = [];

  /**
   * Timestamp of the last hit
   */
  private lastHitTime: number = 0;

  /**
   * Whether the current combo is still active
   */
  private comboActive: boolean = false;

  /**
   * Combo timing constraints
   */
  private timingConfig: ComboTimingConfig = {
    maxTimeBetweenHits: 1500, // 1.5 seconds between hits
    cancelWindow: 200, // 0.2 seconds to cancel
    linkWindow: 100, // 0.1 seconds to link
  };

  /**
   * Flag to track if juggle state is active
   */
  private isJuggleActive: boolean = false;

  /**
   * Maximum allowed juggle hits
   */
  private maxJuggleHits: number = 3;

  /**
   * Current juggle hit count
   */
  private currentJuggleCount: number = 0;

  /**
   * Player number (for UI updates)
   */
  private playerNumber: 1 | 2;

  /**
   * Last attack that made contact
   */
  private lastConnectedAttack: Attack | null = null;

  /**
   * Damage scaling system
   */
  private damageScalingSystem: DamageScalingSystem;

  /**
   * Constructor
   * @param character The character that owns this combo system
   * @param attackSystem The character's attack system
   * @param playerNumber Player number (1 or 2)
   * @param damageScalingConfig Optional damage scaling configuration
   */
  constructor(
    character: Character,
    attackSystem: AttackSystem,
    playerNumber: 1 | 2,
    damageScalingConfig?: Partial<DamageScalingConfig>
  ) {
    this.character = character;
    this.attackSystem = attackSystem;
    this.playerNumber = playerNumber;

    // Initialize damage scaling system with optional config
    this.damageScalingSystem = new DamageScalingSystem(damageScalingConfig);

    // Subscribe to attack system phase changes to detect attack windows
    this.attackSystem.setOnPhaseChangeCallback(
      this.onAttackPhaseChanged.bind(this)
    );
  }

  /**
   * Set custom damage scaling configuration
   * @param config New damage scaling configuration
   */
  public setDamageScalingConfig(config: Partial<DamageScalingConfig>): void {
    this.damageScalingSystem.setConfig(config);
  }

  /**
   * Get the current damage scaling configuration
   */
  public getDamageScalingConfig(): DamageScalingConfig {
    return this.damageScalingSystem.getConfig();
  }

  /**
   * Get the current damage scaling factor
   */
  public getCurrentScalingFactor(): number {
    return this.damageScalingSystem.getCurrentScalingFactor();
  }

  /**
   * Set the UI manager for displaying combos
   * @param uiManager UI manager reference
   */
  public setUIManager(uiManager: UIManager): void {
    this.uiManager = uiManager;
  }

  /**
   * Set custom combo timing configuration
   * @param config New timing configuration
   */
  public setComboTimingConfig(config: Partial<ComboTimingConfig>): void {
    this.timingConfig = {
      ...this.timingConfig,
      ...config,
    };
  }

  /**
   * Handle attack phase changes
   * @param attack The current attack
   * @param phase The new phase
   */
  private onAttackPhaseChanged(attack: Attack, phase: AttackPhase): void {
    // Track phases to determine combo connection types later
  }

  /**
   * Called when an attack successfully hits an opponent
   * @param opponent The character that was hit
   * @param attack The attack that hit
   * @param rawDamage The raw damage value
   * @returns Whether the hit was part of a combo
   */
  public onHit(
    opponent: Character,
    attack: Attack,
    rawDamage: number
  ): boolean {
    const currentTime = performance.now();

    // Determine if the hit continues the current combo
    const isCombo =
      this.comboActive &&
      currentTime - this.lastHitTime <= this.timingConfig.maxTimeBetweenHits;

    // Determine connection type
    let connectionType = ComboConnectionType.LINK;
    if (this.lastConnectedAttack) {
      // If still in active frames or cancel window of previous attack, it's a cancel
      if (
        this.attackSystem.getCurrentPhase() === AttackPhase.ACTIVE ||
        (this.attackSystem.getCurrentPhase() === AttackPhase.RECOVERY &&
          this.attackSystem.getPhaseProgress() > 0.7)
      ) {
        // Can cancel in last 30% of recovery
        connectionType = ComboConnectionType.CANCEL;
      }

      // Check for predefined chains
      if (this.isValidChain(this.lastConnectedAttack.name, attack.name)) {
        connectionType = ComboConnectionType.CHAIN;
      }

      // Check for special character-specific connections
      if (
        this.isSpecialConnection(this.lastConnectedAttack.name, attack.name)
      ) {
        connectionType = ComboConnectionType.SPECIAL;
      }
    }

    // Get attack history for damage scaling
    const attackHistory = isCombo
      ? (this.currentCombo
          .map((hit) => this.getAttackByName(hit.attackName))
          .filter(Boolean) as Attack[])
      : [];

    // Calculate the combo length considering if this is a new combo or continuing one
    const comboLength = isCombo ? this.currentCombo.length + 1 : 1;

    // Use the damage scaling system to calculate the scaled damage
    const scaledDamage = this.damageScalingSystem.calculateScaledDamage(
      rawDamage,
      comboLength,
      attack,
      attackHistory
    );

    // Get the current scaling factor for display/tracking
    const scalingFactor = this.damageScalingSystem.getCurrentScalingFactor();

    // Record the hit
    const hit: ComboHit = {
      attackName: attack.name,
      rawDamage,
      scaledDamage,
      connectionType,
      timestamp: currentTime,
      scalingFactor,
    };

    // Start a new combo or add to existing
    if (!isCombo) {
      this.resetCombo();
      this.currentCombo.push(hit);
      this.comboActive = true;

      // Reset juggle state
      this.isJuggleActive = false;
      this.currentJuggleCount = 0;

      // Update UI
      this.updateComboUI(1);
    } else {
      this.currentCombo.push(hit);

      // Check juggle state
      if (!opponent.isOnGround()) {
        this.isJuggleActive = true;
        this.currentJuggleCount++;

        // Add a temporary juggle-specific damage modifier if needed
        if (this.currentJuggleCount > 1) {
          this.damageScalingSystem.applyTemporaryModifier(
            "juggle-penalty",
            0.9, // 10% additional reduction per juggle hit
            1 // Only applies to the next hit
          );
        }
      }

      // Update UI with increased combo count
      this.updateComboUI(this.currentCombo.length);
    }

    // Update tracking variables
    this.lastHitTime = currentTime;
    this.lastConnectedAttack = attack;

    // Apply special modifiers based on connection type
    this.applyConnectionSpecificModifiers(connectionType);

    return isCombo;
  }

  /**
   * Apply scaling modifiers based on connection type
   * @param connectionType The type of combo connection
   */
  private applyConnectionSpecificModifiers(
    connectionType: ComboConnectionType
  ): void {
    // Example: Apply different modifiers based on connection type
    switch (connectionType) {
      case ComboConnectionType.CANCEL:
        // Cancels are common in combos, apply standard scaling
        break;
      case ComboConnectionType.LINK:
        // Links are harder to do, reward with less scaling
        this.damageScalingSystem.applyTemporaryModifier("link-bonus", 1.1, 1);
        break;
      case ComboConnectionType.CHAIN:
        // Chains are built-in, standard scaling
        break;
      case ComboConnectionType.SPECIAL:
        // Special connections are character-specific and should be rewarded
        this.damageScalingSystem.applyTemporaryModifier(
          "special-bonus",
          1.15,
          1
        );
        break;
    }
  }

  /**
   * Find an attack definition by name
   * @param name Attack name to find
   * @returns The attack definition or null if not found
   */
  private getAttackByName(name: string): Attack | null {
    // This is a simplified implementation - in a real game,
    // you would lookup from a registry of attacks
    return this.attackSystem.getAttackByName(name);
  }

  /**
   * Update the combo counter UI
   * @param comboCount Current combo count
   */
  private updateComboUI(comboCount: number): void {
    if (this.uiManager) {
      this.uiManager.incrementCombo(this.playerNumber);
    }
  }

  /**
   * Reset the current combo
   */
  public resetCombo(): void {
    if (this.comboActive && this.currentCombo.length > 0) {
      // Log combo stats if it was significant
      if (this.currentCombo.length >= 3) {
        this.logComboStats();
      }
    }

    this.currentCombo = [];
    this.comboActive = false;
    this.isJuggleActive = false;
    this.currentJuggleCount = 0;
    this.lastConnectedAttack = null;

    // Reset the damage scaling system
    this.damageScalingSystem.reset();

    // Reset UI
    if (this.uiManager) {
      this.uiManager.resetCombo(this.playerNumber);
    }

    // Reset combo in the attack system
    this.attackSystem.resetCombo();
  }

  /**
   * Check if the combo should end (e.g., too much time has passed)
   * @param deltaTime Time since last update in milliseconds
   * @param frameCount Number of frames that passed (for damage scaling updates)
   */
  public update(deltaTime: number, frameCount: number = 1): void {
    if (!this.comboActive) return;

    const currentTime = performance.now();

    // Update the damage scaling system (for frame-based temporary modifiers)
    this.damageScalingSystem.update(frameCount);

    // Check if combo timeout has been reached
    if (currentTime - this.lastHitTime > this.timingConfig.maxTimeBetweenHits) {
      this.resetCombo();
    }

    // Check juggle limit
    if (this.isJuggleActive && this.currentJuggleCount > this.maxJuggleHits) {
      // Force opponent to ground state after max juggle hits
      // This would typically be handled by the physics system
    }
  }

  /**
   * Check if moving from one attack to another is a valid chain
   * @param prevAttack Previous attack name
   * @param nextAttack Next attack name
   */
  private isValidChain(prevAttack: string, nextAttack: string): boolean {
    // Simplified example:
    // Light attacks can chain to medium attacks
    // Medium attacks can chain to heavy attacks

    const attackStrength = (name: string): number => {
      if (name.includes("light")) return 1;
      if (name.includes("medium")) return 2;
      if (name.includes("heavy")) return 3;
      return 0;
    };

    const prevStrength = attackStrength(prevAttack);
    const nextStrength = attackStrength(nextAttack);

    // Can chain from lighter to heavier attacks
    return nextStrength > prevStrength;
  }

  /**
   * Check if two attacks form a special character-specific connection
   * @param prevAttack Previous attack name
   * @param nextAttack Next attack name
   */
  private isSpecialConnection(prevAttack: string, nextAttack: string): boolean {
    // Character-specific special connections would go here
    // Example: special target combos, unique chains, etc.

    // In the future, this could be data-driven from character config
    return false;
  }

  /**
   * Calculate the total damage of the current combo
   */
  public getTotalDamage(): number {
    return this.currentCombo.reduce((sum, hit) => sum + hit.scaledDamage, 0);
  }

  /**
   * Get the current combo hit count
   */
  public getComboCount(): number {
    return this.currentCombo.length;
  }

  /**
   * Determine if the combo is still considered active
   */
  public isComboActive(): boolean {
    return this.comboActive;
  }

  /**
   * Get a statistical breakdown of the current combo
   */
  public getComboStats(): {
    hitCount: number;
    totalDamage: number;
    rawDamage: number;
    averageScaling: number;
    duration: number;
    connections: {
      cancels: number;
      links: number;
      chains: number;
      specials: number;
    };
  } {
    if (this.currentCombo.length === 0) {
      return {
        hitCount: 0,
        totalDamage: 0,
        rawDamage: 0,
        averageScaling: 1,
        duration: 0,
        connections: {
          cancels: 0,
          links: 0,
          chains: 0,
          specials: 0,
        },
      };
    }

    const totalScaledDamage = this.getTotalDamage();
    const totalRawDamage = this.currentCombo.reduce(
      (sum, hit) => sum + hit.rawDamage,
      0
    );

    const startTime = this.currentCombo[0].timestamp;
    const endTime = this.currentCombo[this.currentCombo.length - 1].timestamp;

    let cancels = 0,
      links = 0,
      chains = 0,
      specials = 0;

    for (const hit of this.currentCombo) {
      switch (hit.connectionType) {
        case ComboConnectionType.CANCEL:
          cancels++;
          break;
        case ComboConnectionType.LINK:
          links++;
          break;
        case ComboConnectionType.CHAIN:
          chains++;
          break;
        case ComboConnectionType.SPECIAL:
          specials++;
          break;
      }
    }

    // First hit isn't a connection
    if (cancels > 0) cancels--;
    if (links > 0) links--;
    if (chains > 0) chains--;
    if (specials > 0) specials--;

    return {
      hitCount: this.currentCombo.length,
      totalDamage: totalScaledDamage,
      rawDamage: totalRawDamage,
      averageScaling: totalScaledDamage / totalRawDamage,
      duration: endTime - startTime,
      connections: {
        cancels,
        links,
        chains,
        specials,
      },
    };
  }

  /**
   * Log combo statistics for debugging/display
   */
  private logComboStats(): void {
    const stats = this.getComboStats();
    console.log(
      `COMBO: ${stats.hitCount} hits | ${
        stats.totalDamage
      } damage | ${stats.duration.toFixed(2)}ms`
    );
    console.log(
      `Scaling: ${(stats.averageScaling * 100).toFixed(1)}% | Connections: ${
        stats.connections.cancels
      } cancels, ${stats.connections.links} links, ${
        stats.connections.chains
      } chains, ${stats.connections.specials} specials`
    );
  }

  /**
   * Get the attack history of the current combo
   */
  public getAttackHistory(): string[] {
    return this.currentCombo.map((hit) => hit.attackName);
  }

  /**
   * Get scaling history throughout the combo
   */
  public getScalingHistory(): number[] {
    return this.currentCombo.map((hit) => hit.scalingFactor);
  }
}
