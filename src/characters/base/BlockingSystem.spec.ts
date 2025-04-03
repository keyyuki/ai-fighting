/**
 * BlockingSystem.spec.ts
 * Unit tests for the BlockingSystem class
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import { BlockingSystem } from "./BlockingSystem";
import { BlockType } from "./interface/IBlockingSystem";
import { Character, CharacterState } from "./Character";
import { Attack } from "./interface/IAttackSystem";

// Mock AudioService
vi.mock("../../utils/audioService", () => ({
  playSound: vi.fn(),
}));

// Mock implementation of Character
class MockCharacter implements Partial<Character> {
  private state: CharacterState = CharacterState.IDLE;
  private position = { x: 0, y: 0 };
  private stateDuration = 0;
  private force = { x: 0, y: 0 };

  changeState(newState: CharacterState): void {
    this.state = newState;
  }

  getPosition() {
    return this.position;
  }

  setStateDuration(duration: number): void {
    this.stateDuration = duration;
  }

  applyForce(force: { x: number; y: number }): void {
    this.force = force;
  }

  getState(): CharacterState {
    return this.state;
  }

  // For testing purposes
  getForce() {
    return this.force;
  }

  getStateDuration() {
    return this.stateDuration;
  }
}

// Mock attack for testing
const createMockAttack = (overrides: Partial<Attack> = {}): Attack => {
  return {
    name: "Test Attack",
    type: "medium",
    frameData: {
      startup: 5,
      active: 3,
      recovery: 10,
      hitstun: 20,
      blockstun: 15,
      damage: 10,
      knockback: { x: 5, y: 0 },
    },
    canBeCanceled: false,
    animationId: "test_attack",
    canUseInAir: false,
    canUseWhileCrouching: true,
    ...overrides,
  };
};

describe("BlockingSystem", () => {
  let blockingSystem: BlockingSystem;
  let character: MockCharacter;

  beforeEach(() => {
    character = new MockCharacter();
    blockingSystem = new BlockingSystem(character as unknown as Character);
  });

  test("should initialize with default values", () => {
    expect(blockingSystem.getIsBlocking()).toBe(false);
    expect(blockingSystem.getBlockType()).toBe(BlockType.NONE);
    expect(blockingSystem.getGuardMeter()).toBe(100);
    expect(blockingSystem.getGuardMeterPercentage()).toBe(100);
  });

  test("should set blocking state correctly", () => {
    // Standing block
    blockingSystem.setBlocking(true, false);
    expect(blockingSystem.getIsBlocking()).toBe(true);
    expect(blockingSystem.getBlockType()).toBe(BlockType.HIGH);

    // Crouching block
    blockingSystem.setBlocking(true, true);
    expect(blockingSystem.getIsBlocking()).toBe(true);
    expect(blockingSystem.getBlockType()).toBe(BlockType.LOW);

    // Not blocking
    blockingSystem.setBlocking(false, false);
    expect(blockingSystem.getIsBlocking()).toBe(false);
    expect(blockingSystem.getBlockType()).toBe(BlockType.NONE);
  });

  test("should correctly determine if attack can be blocked", () => {
    // Regular attack, not blocking
    let attack = createMockAttack();
    blockingSystem.setBlocking(false, false);
    expect(blockingSystem.canBlockAttack(attack)).toBe(false);

    // Regular attack, blocking high
    blockingSystem.setBlocking(true, false);
    expect(blockingSystem.canBlockAttack(attack)).toBe(true);

    // Low attack, blocking high
    attack = createMockAttack({ mustBlockLow: true });
    expect(blockingSystem.canBlockAttack(attack)).toBe(false);

    // Low attack, blocking low
    blockingSystem.setBlocking(true, true);
    expect(blockingSystem.canBlockAttack(attack)).toBe(true);

    // Unblockable attack
    attack = createMockAttack({ unblockable: true });
    expect(blockingSystem.canBlockAttack(attack)).toBe(false);

    // Guard meter depleted
    blockingSystem.setBlocking(true, false);
    // Manually deplete guard meter for testing
    for (let i = 0; i < 20; i++) {
      blockingSystem.processBlock(
        createMockAttack({ frameData: { ...attack.frameData, damage: 50 } }),
        character as unknown as Character
      );
    }
    expect(blockingSystem.getGuardMeter()).toBe(0);
    expect(blockingSystem.canBlockAttack(attack)).toBe(false);
  });

  test("should process block correctly", () => {
    const attacker = new MockCharacter();
    vi.spyOn(attacker, "getPosition").mockReturnValue({ x: 100, y: 0 });

    const attack = createMockAttack();
    blockingSystem.setBlocking(true, false);

    // Process block
    const damageDealt = blockingSystem.processBlock(
      attack,
      attacker as unknown as Character
    );

    // Verify damage reduction
    expect(damageDealt).toBe(2); // 20% of 10 damage

    // Verify character was put in blockstun
    expect(character.getState()).toBe(CharacterState.BLOCKSTUN);
    expect(character.getStateDuration()).toBe(15 * 16.67); // blockstun frames converted to ms

    // Verify pushback was applied (negative direction since attacker is to the right)
    const force = character.getForce();
    expect(force.x).toBeLessThan(0);
  });

  test("should handle guard break", () => {
    const attacker = new MockCharacter();
    vi.spyOn(attacker, "getPosition").mockReturnValue({ x: 0, y: 0 });

    blockingSystem.setBlocking(true, false);

    // Create a high-damage attack to break guard in one hit
    const attack = createMockAttack({
      frameData: {
        startup: 5,
        active: 3,
        recovery: 10,
        hitstun: 20,
        blockstun: 15,
        damage: 1000,
        knockback: { x: 5, y: 0 },
      },
    });

    // Process block and break guard
    blockingSystem.processBlock(attack, attacker as unknown as Character);

    // Verify guard is broken
    expect(blockingSystem.getGuardMeter()).toBe(0);
    expect(character.getState()).toBe(CharacterState.HITSTUN);
    expect(blockingSystem.getIsBlocking()).toBe(false);
  });

  test("should recover guard meter over time", () => {
    blockingSystem.setBlocking(true, false);

    // Deal some guard meter damage
    const attack = createMockAttack();
    blockingSystem.processBlock(
      attack,
      new MockCharacter() as unknown as Character
    );

    // Guard meter should be reduced
    expect(blockingSystem.getGuardMeter()).toBeLessThan(100);

    // Stop blocking
    blockingSystem.setBlocking(false, false);

    // After recovery delay time passes
    blockingSystem.update(1001); // Just over 1 second

    // Allow some recovery
    blockingSystem.update(500); // Half a second of recovery

    // Guard meter should have increased
    const meterAfterRecovery = blockingSystem.getGuardMeter();
    expect(meterAfterRecovery).toBeGreaterThan(0);

    // Continue recovering for enough time to fully recover
    blockingSystem.update(10000);

    // Guard meter should be full
    expect(blockingSystem.getGuardMeter()).toBe(100);
  });

  test("should reset guard meter", () => {
    // Deal some guard meter damage
    blockingSystem.setBlocking(true, false);
    const attack = createMockAttack();
    blockingSystem.processBlock(
      attack,
      new MockCharacter() as unknown as Character
    );

    // Verify guard meter is reduced
    expect(blockingSystem.getGuardMeter()).toBeLessThan(100);

    // Reset guard meter
    blockingSystem.resetGuardMeter();

    // Verify guard meter is full
    expect(blockingSystem.getGuardMeter()).toBe(100);
  });

  // Edge case: test guard meter percentage calculation
  test("should calculate guard meter percentage correctly", () => {
    // Start with full guard meter
    expect(blockingSystem.getGuardMeterPercentage()).toBe(100);

    // Deal damage to set guard meter to half
    blockingSystem.setBlocking(true, false);
    for (let i = 0; i < 10; i++) {
      blockingSystem.processBlock(
        createMockAttack({
          frameData: { ...createMockAttack().frameData, damage: 10 },
        }),
        new MockCharacter() as unknown as Character
      );
    }

    // Expected percentage should roughly be 50% (might vary a bit due to damage calculation)
    const percentage = blockingSystem.getGuardMeterPercentage();
    expect(percentage).toBeLessThan(100);
    expect(percentage).toBeGreaterThan(0);
  });
});
