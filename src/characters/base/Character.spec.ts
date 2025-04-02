/**
 * Character.spec.ts
 * Unit tests for the base Character class
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Character,
  CharacterState,
  CharacterStats,
  FacingDirection,
} from "./Character";
import { SpriteAnimationSystem } from "../../engine/core/SpriteAnimationSystem";
import {
  CollisionSystem,
  ColliderType,
} from "../../engine/physics/CollisionSystem";
import { InputManager, InputConfig } from "../../engine/input/InputManager";
import * as AudioService from "../../utils/audioService";

// Mock the AudioService
vi.mock("../../utils/audioService", () => ({
  playSound: vi.fn(),
  loadAudio: vi.fn().mockResolvedValue({}),
  stopSound: vi.fn(),
}));

describe("Character", () => {
  let character: Character;
  let animationSystem: SpriteAnimationSystem;
  let collisionSystem: CollisionSystem;
  let inputManager: InputManager;

  const characterStats: CharacterStats = {
    health: 100,
    walkSpeed: 3,
    jumpPower: 10,
    weight: 1,
    attackPower: 1,
  };

  // Mock animation system
  const mockAnimation = {
    getName: vi.fn().mockReturnValue("idle"),
    getCurrentFrame: vi
      .fn()
      .mockReturnValue({ x: 0, y: 0, width: 64, height: 64 }),
    isFinished: vi.fn().mockReturnValue(false),
    setOnComplete: vi.fn(),
    reset: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup animation system
    animationSystem = new SpriteAnimationSystem();
    vi.spyOn(animationSystem, "playAnimation").mockReturnValue(mockAnimation);
    vi.spyOn(animationSystem, "renderAnimation").mockImplementation(() => {});

    // Setup collision system
    collisionSystem = new CollisionSystem();
    vi.spyOn(collisionSystem, "registerCollider").mockImplementation(() => {});
    vi.spyOn(collisionSystem, "updateCollider").mockImplementation(() => {});
    vi.spyOn(collisionSystem, "setColliderActive").mockImplementation(() => {});

    // Setup input manager
    const inputConfig: InputConfig = {
      keyboard: {
        KeyW: "up",
        KeyS: "down",
        KeyA: "left",
        KeyD: "right",
        KeyJ: "attack_light",
        KeyK: "attack_medium",
        KeyL: "attack_heavy",
      },
    };
    inputManager = new InputManager(inputConfig);
    vi.spyOn(inputManager, "isPressed").mockImplementation(
      (key: string) => false
    );
    vi.spyOn(inputManager, "isJustPressed").mockImplementation(
      (key: string) => false
    );

    // Create test character
    character = new TestCharacter(
      "player1",
      "Test Fighter",
      "test_sprite",
      characterStats,
      { x: 100, y: 300 },
      animationSystem,
      collisionSystem
    );

    character.setInputManager(inputManager, "player1");
  });

  it("should initialize with correct default values", () => {
    expect(character.getHealth()).toBe(100);
    expect(character.getPosition()).toEqual({ x: 100, y: 300 });
    expect(character.getState()).toBe(CharacterState.IDLE);
    expect(character.isDead()).toBe(false);
  });

  it("should change state based on input", () => {
    // Mock pressing the right key
    vi.spyOn(inputManager, "isPressed").mockImplementation((key: string) =>
      key === "right" ? true : false
    );

    // Update character
    character.update(16.67);

    // Should be in WALK_FORWARD state
    expect(character.getState()).toBe(CharacterState.WALK_FORWARD);

    // Mock pressing no keys
    vi.spyOn(inputManager, "isPressed").mockImplementation(() => false);

    // Update character again
    character.update(16.67);

    // Should return to IDLE state
    expect(character.getState()).toBe(CharacterState.IDLE);
  });

  it("should perform attack when attack button is pressed", () => {
    // Mock pressing attack button
    vi.spyOn(inputManager, "isJustPressed").mockImplementation((key: string) =>
      key === "attack_light" ? true : false
    );

    // Update character
    character.update(16.67);

    // Should be in ATTACK_LIGHT state
    expect(character.getState()).toBe(CharacterState.ATTACK_LIGHT);

    // Sound effect should have been played
    expect(AudioService.playSound).toHaveBeenCalledWith("attack_light");
  });

  it("should jump when up is pressed", () => {
    // Mock pressing up key
    vi.spyOn(inputManager, "isPressed").mockImplementation((key: string) =>
      key === "up" ? true : false
    );

    // Update character
    character.update(16.67);

    // Should be in JUMP_START state
    expect(character.getState()).toBe(CharacterState.JUMP_START);

    // Sound effect should have been played
    expect(AudioService.playSound).toHaveBeenCalledWith("jump_start");
  });

  it("should take damage when hit", () => {
    // Create an attacker character
    const attacker = new TestCharacter(
      "player2",
      "Attacker",
      "test_sprite",
      characterStats,
      { x: 150, y: 300 },
      animationSystem,
      collisionSystem
    );

    // Get initial health
    const initialHealth = character.getHealth();

    // Create mock attack data
    const attackData = {
      startup: 5,
      active: 3,
      recovery: 10,
      damage: 10,
      hitstun: 20,
      blockstun: 15,
      knockback: { x: 3, y: 2 },
    };

    // Character takes damage
    const wasHit = character.takeDamage(
      attackData.damage,
      attacker,
      attackData
    );

    // Should have taken damage
    expect(wasHit).toBe(true);
    expect(character.getHealth()).toBe(initialHealth - attackData.damage);

    // Should be in HITSTUN state
    expect(character.getState()).toBe(CharacterState.HITSTUN);

    // Sound effect should have been played
    expect(AudioService.playSound).toHaveBeenCalledWith("hit");
  });

  it("should block attacks when blocking", () => {
    // Set character to blocking state manually
    (character as any).isBlocking = true;

    // Create an attacker character
    const attacker = new TestCharacter(
      "player2",
      "Attacker",
      "test_sprite",
      characterStats,
      { x: 150, y: 300 },
      animationSystem,
      collisionSystem
    );

    // Get initial health
    const initialHealth = character.getHealth();

    // Create mock attack data
    const attackData = {
      startup: 5,
      active: 3,
      recovery: 10,
      damage: 10,
      hitstun: 20,
      blockstun: 15,
      knockback: { x: 3, y: 2 },
    };

    // Character takes damage while blocking
    const wasHit = character.takeDamage(
      attackData.damage,
      attacker,
      attackData
    );

    // Should not have been hit (blocked instead)
    expect(wasHit).toBe(false);

    // Should have taken reduced damage
    const expectedDamage = Math.floor(attackData.damage * 0.2);
    expect(character.getHealth()).toBe(initialHealth - expectedDamage);

    // Should be in BLOCKSTUN state
    expect(character.getState()).toBe(CharacterState.BLOCKSTUN);

    // Block sound effect should have been played
    expect(AudioService.playSound).toHaveBeenCalledWith("block");
  });

  it("should update animation based on state", () => {
    // Update character in different states and check animation
    character.update(16.67);

    // Should have played the idle animation
    expect(animationSystem.playAnimation).toHaveBeenCalledWith(
      "idle", // Animation ID
      "player1", // Entity ID
      expect.any(Boolean) // Reset animation flag
    );

    // Change to walking state
    vi.spyOn(inputManager, "isPressed").mockImplementation((key: string) =>
      key === "right" ? true : false
    );

    // Clear previous animation calls
    (animationSystem.playAnimation as any).mockClear();

    // Update character
    character.update(16.67);

    // Should have played the walk animation
    expect(animationSystem.playAnimation).toHaveBeenCalledWith(
      "walk", // Animation ID
      "player1", // Entity ID
      expect.any(Boolean) // Reset animation flag
    );
  });
});

// TestCharacter implementation extending the abstract Character class
class TestCharacter extends Character {
  constructor(
    id: string,
    name: string,
    spriteSheetId: string,
    stats: CharacterStats,
    position: { x: number; y: number },
    animationSystem: SpriteAnimationSystem,
    collisionSystem: CollisionSystem
  ) {
    super(
      id,
      name,
      spriteSheetId,
      stats,
      position,
      animationSystem,
      collisionSystem
    );

    // Initialize basic attacks
    this.attackData = {
      light: {
        startup: 5,
        active: 3,
        recovery: 10,
        damage: 5,
        hitstun: 15,
        blockstun: 10,
        knockback: { x: 1, y: 0 },
      },
      medium: {
        startup: 8,
        active: 4,
        recovery: 15,
        damage: 10,
        hitstun: 20,
        blockstun: 15,
        knockback: { x: 2, y: 1 },
      },
      heavy: {
        startup: 12,
        active: 5,
        recovery: 20,
        damage: 15,
        hitstun: 25,
        blockstun: 20,
        knockback: { x: 3, y: 2 },
      },
    };
  }

  // Expose protected methods for testing
  public getId(): string {
    return this.id;
  }

  public getFacingDirection(): number {
    return this.facingDirection;
  }

  public isOnGround(): boolean {
    return this.isGrounded;
  }

  public isCrouching(): boolean {
    return this.currentState === CharacterState.CROUCH;
  }

  public getHorizontalInput(): number {
    if (!this.inputManager) return 0;

    if (this.inputManager.isPressed("right")) return 1;
    if (this.inputManager.isPressed("left")) return -1;
    return 0;
  }
}
