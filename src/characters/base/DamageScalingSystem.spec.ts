/**
 * DamageScalingSystem.spec.ts
 * Unit tests for the damage scaling system
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DamageScalingSystem } from "./DamageScalingSystem";
import {
  Attack,
  AttackFrameData,
  AttackPhase,
} from "./interface/IAttackSystem";

describe("DamageScalingSystem", () => {
  // Mock attack data for testing
  const createMockAttack = (
    name: string,
    type: string,
    damage: number
  ): Attack => {
    const frameData: AttackFrameData = {
      startup: 5,
      active: 3,
      recovery: 10,
      hitstun: 15,
      blockstun: 10,
      damage,
      knockback: { x: 2, y: 1 },
    };

    return {
      name,
      type,
      frameData,
      canBeCanceled: true,
      animationId: `${type}_${name}`,
      canUseInAir: false,
      canUseWhileCrouching: true,
    };
  };

  // Mock attacks
  const lightAttack = createMockAttack("jab", "light", 10);
  const mediumAttack = createMockAttack("kick", "medium", 20);
  const heavyAttack = createMockAttack("uppercut", "heavy", 30);
  const specialAttack = createMockAttack("fireball", "special", 25);
  const superAttack = createMockAttack("ultimate", "super", 50);

  describe("basic functionality", () => {
    it("should initialize with default values", () => {
      const damageSystem = new DamageScalingSystem();
      expect(damageSystem.getCurrentScalingFactor()).toBe(1.0);

      const config = damageSystem.getConfig();
      expect(config.minimumScalingPercentage).toBe(0.1);
      expect(config.scalingPerHit).toBe(0.1);
    });

    it("should allow custom configuration", () => {
      const customConfig = {
        minimumScalingPercentage: 0.2,
        scalingPerHit: 0.15,
      };

      const damageSystem = new DamageScalingSystem(customConfig);
      const config = damageSystem.getConfig();

      expect(config.minimumScalingPercentage).toBe(0.2);
      expect(config.scalingPerHit).toBe(0.15);
      // Should keep default values for other properties
      expect(config.baseScalingFactor).toBe(1.0);
    });
  });

  describe("damage scaling calculations", () => {
    let damageSystem: DamageScalingSystem;

    beforeEach(() => {
      damageSystem = new DamageScalingSystem();
    });

    it("should not scale damage on the first hit", () => {
      const scaled = damageSystem.calculateScaledDamage(10, 1, lightAttack);
      expect(scaled).toBe(10);
      expect(damageSystem.getCurrentScalingFactor()).toBe(1.0);
    });

    it("should apply scaling for subsequent hits", () => {
      // First hit - no scaling
      let scaled = damageSystem.calculateScaledDamage(10, 1, lightAttack);
      expect(scaled).toBe(10);

      // Second hit - should have scaling applied
      scaled = damageSystem.calculateScaledDamage(10, 2, mediumAttack);
      expect(scaled).toBe(9); // 10 * 0.9 = 9
    });

    it("should respect minimum scaling percentage", () => {
      // Create a combo long enough to hit minimum scaling
      const comboLength = 15; // With 0.1 reduction per hit, should hit minimum
      const scaled = damageSystem.calculateScaledDamage(
        100,
        comboLength,
        lightAttack
      );

      // Minimum is 0.1, so 100 * 0.1 = 10
      expect(scaled).toBe(10);
      expect(damageSystem.getCurrentScalingFactor()).toBe(0.1);
    });

    it("should apply different scaling based on attack type", () => {
      // Second hit in combo with different attack types
      const lightScaled = damageSystem.calculateScaledDamage(
        100,
        2,
        lightAttack
      );
      damageSystem.reset();
      const heavyScaled = damageSystem.calculateScaledDamage(
        100,
        2,
        heavyAttack
      );

      // Light attacks should scale more (light: 0.9, heavy: 1.0)
      expect(lightScaled).toBeLessThan(heavyScaled);
    });
  });

  describe("combo and repeated move scaling", () => {
    let damageSystem: DamageScalingSystem;

    beforeEach(() => {
      damageSystem = new DamageScalingSystem();
    });

    it("should apply additional scaling for repeated moves", () => {
      // Configure system to definitely use repeated move scaling
      damageSystem.setConfig({
        applyRepeatedMoveScaling: true,
        repeatedMoveScalingFactor: 0.8,
      });

      const attackHistory = [lightAttack, lightAttack]; // repeated light attack

      // Third hit with same move repeated twice before
      const scaledWithRepeats = damageSystem.calculateScaledDamage(
        100,
        3,
        lightAttack,
        attackHistory
      );

      // Reset and calculate with different moves
      damageSystem.reset();
      const differentHistory = [lightAttack, mediumAttack]; // no repeats
      const scaledWithoutRepeats = damageSystem.calculateScaledDamage(
        100,
        3,
        heavyAttack,
        differentHistory
      );

      expect(scaledWithRepeats).toBeLessThan(scaledWithoutRepeats);
    });

    it("should reset scaling when combo ends", () => {
      // Do some hits to apply scaling
      damageSystem.calculateScaledDamage(10, 5, lightAttack);
      expect(damageSystem.getCurrentScalingFactor()).toBeLessThan(1.0);

      // Reset and check
      damageSystem.reset();
      expect(damageSystem.getCurrentScalingFactor()).toBe(1.0);
    });

    it("should cap scaling at max hits", () => {
      // Set a low max hits value
      damageSystem.setConfig({ maxScalingHits: 3 });

      // Calculate damage at max hits
      const atMax = damageSystem.calculateScaledDamage(100, 3, lightAttack);

      // Calculate damage beyond max hits
      const beyondMax = damageSystem.calculateScaledDamage(100, 4, lightAttack);

      // Should be at minimum scaling
      expect(beyondMax).toBe(10); // 100 * 0.1 = 10
    });
  });

  describe("temporary modifiers", () => {
    let damageSystem: DamageScalingSystem;

    beforeEach(() => {
      damageSystem = new DamageScalingSystem();
    });

    it("should apply temporary modifiers correctly", () => {
      // Apply a temporary modifier (50% increase)
      damageSystem.applyTemporaryModifier("test", 1.5, 10);

      // Calculate damage with modifier active
      const scaled = damageSystem.calculateScaledDamage(10, 2, lightAttack);

      // Should have the modifier applied
      // Base scaling for hit 2 would be 0.9, but with 1.5x modifier it's 0.9 * 1.5 = 1.35
      // But since scaling can't go above base (1.0), it should be capped
      expect(scaled).toBe(9); // 10 * 0.9 = 9
    });

    it("should remove temporary modifiers after duration", () => {
      // Apply a temporary modifier with 5 frame duration
      damageSystem.applyTemporaryModifier("test", 0.5, 5);

      // Check that modifier is applied
      const scaledBefore = damageSystem.calculateScaledDamage(
        100,
        2,
        lightAttack
      );

      // Advance 6 frames
      damageSystem.update(6);

      // Modifier should be gone
      const scaledAfter = damageSystem.calculateScaledDamage(
        100,
        2,
        lightAttack
      );

      expect(scaledBefore).toBeLessThan(scaledAfter);
    });

    it("should keep permanent modifiers after reset", () => {
      // Apply a permanent modifier
      damageSystem.applyTemporaryModifier("permanent", 0.8, -1);

      // Apply a temporary modifier
      damageSystem.applyTemporaryModifier("temporary", 0.5, 10);

      // Reset the system
      damageSystem.reset();

      // Calculate damage - permanent modifier should still be there
      let scaled = damageSystem.calculateScaledDamage(10, 2, lightAttack);

      // Base scaling for hit 2 is 0.9, times 0.8 from permanent modifier is 0.72
      // 10 * 0.72 = 7.2, which floors to 7
      expect(scaled).toBe(7);
    });
  });
});
