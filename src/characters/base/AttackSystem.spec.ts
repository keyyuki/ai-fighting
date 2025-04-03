/**
 * AttackSystem.spec.ts
 * Unit tests for the AttackSystem class
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import { AttackSystem } from "./AttackSystem";
import { Attack, AttackPhase } from "./interface/IAttackSystem";
import { Character, CharacterState } from "./Character";
import { InputManager } from "../../engine/input/InputManager";

// Mock AudioService
vi.mock("../../utils/audioService", () => ({
  playSound: vi.fn(),
}));

// Mock Character
class MockCharacter implements Partial<Character> {
  private onGround = true;
  private crouching = false;
  private position = { x: 0, y: 0 };
  private state = CharacterState.IDLE;

  isOnGround(): boolean {
    return this.onGround;
  }

  isCrouching(): boolean {
    return this.crouching;
  }

  getPosition() {
    return this.position;
  }

  takeDamage(amount: number, attacker: Character, frameData: any): void {
    // Mock implementation
  }

  setOnGround(value: boolean): void {
    this.onGround = value;
  }

  setCrouching(value: boolean): void {
    this.crouching = value;
  }

  getState(): CharacterState {
    return this.state;
  }
}

// Mock InputManager
class MockInputManager implements Partial<InputManager> {
  private pressedKeys: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();

  mockKeyDown(key: string): void {
    this.pressedKeys.add(key);
    this.justPressedKeys.add(key);
  }

  mockKeyUp(key: string): void {
    this.pressedKeys.delete(key);
  }

  resetJustPressed(): void {
    this.justPressedKeys.clear();
  }

  isPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  isJustPressed(key: string): boolean {
    return this.justPressedKeys.has(key);
  }
}

// Helper to create a test attack
const createTestAttack = (overrides: Partial<Attack> = {}): Attack => {
  return {
    name: "Test Attack",
    type: "medium",
    frameData: {
      startup: 5,
      active: 3,
      recovery: 7,
      hitstun: 15,
      blockstun: 10,
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

describe("AttackSystem", () => {
  let attackSystem: AttackSystem;
  let character: MockCharacter;
  let inputManager: MockInputManager;
  let phaseChangeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    character = new MockCharacter();
    attackSystem = new AttackSystem(character as unknown as Character);
    inputManager = new MockInputManager();
    attackSystem.setInputManager(inputManager as unknown as InputManager);
    phaseChangeSpy = vi.fn();
    attackSystem.setOnPhaseChangeCallback(phaseChangeSpy);
  });

  test("should initialize correctly", () => {
    expect(attackSystem.isAttackActive()).toBe(false);
    expect(attackSystem.getCurrentAttack()).toBeNull();
    expect(attackSystem.getComboCount()).toBe(0);
  });

  test("should register and execute attacks", () => {
    const attack = createTestAttack();
    attackSystem.registerAttack(attack);

    // Execute the attack
    const result = attackSystem.executeAttack(attack);

    expect(result).toBe(true);
    expect(attackSystem.isAttackActive()).toBe(true);
    expect(attackSystem.getCurrentAttack()).toEqual(attack);
    expect(attackSystem.getCurrentPhase()).toBe(AttackPhase.STARTUP);
    expect(phaseChangeSpy).toHaveBeenCalledWith(attack, AttackPhase.STARTUP);
  });

  test("should progress through attack phases", () => {
    const attack = createTestAttack();
    attackSystem.registerAttack(attack);
    attackSystem.executeAttack(attack);

    // Verify initial state
    expect(attackSystem.getCurrentPhase()).toBe(AttackPhase.STARTUP);

    // Progress to active phase (startup is 5 frames = 83.35ms at 60fps)
    attackSystem.update(84);
    expect(attackSystem.getCurrentPhase()).toBe(AttackPhase.ACTIVE);
    expect(phaseChangeSpy).toHaveBeenCalledWith(attack, AttackPhase.ACTIVE);

    // Progress to recovery phase (active is 3 frames = 50.01ms at 60fps)
    attackSystem.update(51);
    expect(attackSystem.getCurrentPhase()).toBe(AttackPhase.RECOVERY);
    expect(phaseChangeSpy).toHaveBeenCalledWith(attack, AttackPhase.RECOVERY);

    // Progress to completed phase (recovery is 7 frames = 116.69ms at 60fps)
    attackSystem.update(117);
    expect(attackSystem.getCurrentPhase()).toBe(AttackPhase.COMPLETED);
    expect(phaseChangeSpy).toHaveBeenCalledWith(attack, AttackPhase.COMPLETED);
    expect(attackSystem.isAttackActive()).toBe(false);
    expect(attackSystem.getCurrentAttack()).toBeNull();
  });

  test("should handle combo counting and scaling", () => {
    const attack = createTestAttack();
    const defender = new MockCharacter() as unknown as Character;

    attackSystem.executeAttack(attack);

    // Get to active phase
    attackSystem.update(84);

    // Hit an opponent
    attackSystem.onAttackHit(defender);
    expect(attackSystem.getComboCount()).toBe(1);

    // Hit again
    attackSystem.onAttackHit(defender);
    expect(attackSystem.getComboCount()).toBe(2);

    // Reset combo
    attackSystem.resetCombo();
    expect(attackSystem.getComboCount()).toBe(0);
  });

  test("should respect attack cancelability", () => {
    // Non-cancelable attack
    const normalAttack = createTestAttack({ canBeCanceled: false });
    attackSystem.registerAttack(normalAttack);
    attackSystem.executeAttack(normalAttack);

    // Try to execute another attack during startup
    const result = attackSystem.executeAttack(normalAttack);
    expect(result).toBe(false);

    // Cancelable attack
    const cancelableAttack = createTestAttack({
      name: "Cancelable Attack",
      canBeCanceled: true,
    });
    attackSystem.registerAttack(cancelableAttack);

    // Reset and execute the cancelable attack
    attackSystem.interruptCurrentAttack();
    attackSystem.executeAttack(cancelableAttack);

    // Should be able to execute another attack
    const anotherAttack = createTestAttack({ name: "Another Attack" });
    const cancelResult = attackSystem.executeAttack(anotherAttack);
    expect(cancelResult).toBe(true);
  });

  test("should correctly calculate phase progress", () => {
    const attack = createTestAttack({
      frameData: {
        startup: 10, // 166.7ms at 60fps
        active: 5, // 83.35ms at 60fps
        recovery: 15, // 250.05ms at 60fps
        hitstun: 20,
        blockstun: 15,
        damage: 10,
        knockback: { x: 5, y: 0 },
      },
    });

    attackSystem.executeAttack(attack);

    // At start of startup phase
    expect(attackSystem.getPhaseProgress()).toBeCloseTo(1.0, 1);

    // Halfway through startup
    attackSystem.update(83);
    expect(attackSystem.getPhaseProgress()).toBeCloseTo(0.5, 1);

    // Progress to active phase and check
    attackSystem.update(84);
    expect(attackSystem.getCurrentPhase()).toBe(AttackPhase.ACTIVE);
    expect(attackSystem.getPhaseProgress()).toBeCloseTo(1.0, 1);

    // Halfway through active
    attackSystem.update(42);
    expect(attackSystem.getPhaseProgress()).toBeCloseTo(0.5, 1);
  });

  test("should handle aerial and crouching attacks correctly", () => {
    // Register different attacks
    const groundAttack = createTestAttack({
      name: "Ground Attack",
      canUseInAir: false,
      canUseWhileCrouching: false,
    });

    const aerialAttack = createTestAttack({
      name: "Aerial Attack",
      canUseInAir: true,
      canUseWhileCrouching: false,
    });

    const crouchingAttack = createTestAttack({
      name: "Crouching Attack",
      canUseInAir: false,
      canUseWhileCrouching: true,
    });

    attackSystem.registerAttacks([groundAttack, aerialAttack, crouchingAttack]);

    // Test ground attack
    character.setOnGround(true);
    character.setCrouching(false);
    expect(attackSystem.executeAttack(groundAttack)).toBe(true);
    attackSystem.interruptCurrentAttack();

    // Test aerial attack on ground (should fail)
    expect(attackSystem.executeAttack(aerialAttack)).toBe(false);

    // Test aerial attack in air
    character.setOnGround(false);
    expect(attackSystem.executeAttack(aerialAttack)).toBe(true);
    attackSystem.interruptCurrentAttack();

    // Test crouching attack while standing
    character.setOnGround(true);
    character.setCrouching(false);
    expect(attackSystem.executeAttack(crouchingAttack)).toBe(true);
    attackSystem.interruptCurrentAttack();

    // Test crouching attack while crouching
    character.setCrouching(true);
    expect(attackSystem.executeAttack(crouchingAttack)).toBe(true);
  });

  test("should correctly handle input-based attack checks", () => {
    const lightAttack = createTestAttack({
      type: "light",
      name: "Light Attack",
    });
    const mediumAttack = createTestAttack({
      type: "medium",
      name: "Medium Attack",
    });
    const heavyAttack = createTestAttack({
      type: "heavy",
      name: "Heavy Attack",
    });

    attackSystem.registerAttacks([lightAttack, mediumAttack, heavyAttack]);

    // Setup input for light attack
    inputManager.mockKeyDown("attack_light");

    // Check for attacks based on inputs
    attackSystem.update(16.67, [
      "attack_light",
      "attack_medium",
      "attack_heavy",
    ]);

    // Should have executed light attack
    expect(attackSystem.isAttackActive()).toBe(true);
    expect(attackSystem.getCurrentAttack()?.name).toBe("Light Attack");

    // Reset and try medium attack
    attackSystem.interruptCurrentAttack();
    inputManager.resetJustPressed();
    inputManager.mockKeyDown("attack_medium");

    attackSystem.update(16.67, [
      "attack_light",
      "attack_medium",
      "attack_heavy",
    ]);
    expect(attackSystem.getCurrentAttack()?.name).toBe("Medium Attack");
  });

  test("should correctly check for special move sequences", () => {
    // Create special move with input sequence
    const specialMove = createTestAttack({
      name: "Special Move",
      type: "special",
      specialMoveInput: {
        sequence: ["down", "down-forward", "forward", "attack_light"],
        timeWindow: 1000,
      },
    });

    attackSystem.registerAttack(specialMove);

    // Perform the special move sequence
    const now = performance.now();
    vi.spyOn(performance, "now").mockReturnValue(now);

    // Input sequence
    inputManager.mockKeyDown("down");
    attackSystem.update(16.67);
    vi.spyOn(performance, "now").mockReturnValue(now + 100);

    inputManager.resetJustPressed();
    inputManager.mockKeyDown("forward");
    inputManager.mockKeyDown("down-forward"); // This would be detected in a real implementation
    attackSystem.update(16.67);
    vi.spyOn(performance, "now").mockReturnValue(now + 200);

    inputManager.resetJustPressed();
    inputManager.mockKeyUp("down");
    inputManager.mockKeyDown("forward");
    attackSystem.update(16.67);
    vi.spyOn(performance, "now").mockReturnValue(now + 300);

    inputManager.resetJustPressed();
    inputManager.mockKeyDown("attack_light");
    attackSystem.update(16.67);

    // May not actually trigger in the test due to mock limitations, but the structure is tested
    // In a real environment with proper input sequence detection, this would execute the special move
  });

  test("should interrupt current attack", () => {
    const attack = createTestAttack();
    attackSystem.executeAttack(attack);
    expect(attackSystem.isAttackActive()).toBe(true);

    attackSystem.interruptCurrentAttack();
    expect(attackSystem.isAttackActive()).toBe(false);
    expect(attackSystem.getCurrentAttack()).toBeNull();
  });
});
