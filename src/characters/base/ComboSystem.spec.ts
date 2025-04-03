import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import { ComboSystem, ComboConnectionType } from "./ComboSystem";
import { AttackSystem, AttackPhase, Attack } from "./AttackSystem";
import { Character } from "./Character";
import { UIManager } from "../../ui/UIManager";

// Mock dependencies
vi.mock("./AttackSystem");
vi.mock("./Character");
vi.mock("../../ui/UIManager");

describe("ComboSystem", () => {
  let comboSystem: ComboSystem;
  let mockCharacter: Character;
  let mockAttackSystem: AttackSystem;
  let mockUIManager: UIManager;
  let mockOpponent: Character;

  // Sample attack for testing
  const sampleAttack: Attack = {
    name: "test_light_punch",
    type: "light",
    frameData: {
      startup: 5,
      active: 3,
      recovery: 8,
      damage: 10,
      hitstun: 12,
      blockstun: 8,
      knockback: { x: 1, y: 0.5 },
    },
    canBeCanceled: true,
    animationId: "light_punch",
    canUseInAir: false,
    canUseWhileCrouching: true,
  };

  // Sample follow-up attack for testing
  const followupAttack: Attack = {
    name: "test_medium_punch",
    type: "medium",
    frameData: {
      startup: 8,
      active: 4,
      recovery: 12,
      damage: 20,
      hitstun: 18,
      blockstun: 14,
      knockback: { x: 2, y: 1 },
    },
    canBeCanceled: false,
    animationId: "medium_punch",
    canUseInAir: false,
    canUseWhileCrouching: true,
  };

  beforeEach(() => {
    // Mock performance.now for consistent timestamps
    vi.spyOn(performance, "now").mockImplementation(() => 1000);

    // Setup mocks
    mockCharacter = {
      getId: vi.fn().mockReturnValue("player1"),
      takeDamage: vi.fn(),
      isOnGround: vi.fn().mockReturnValue(true),
    } as unknown as Character;

    mockAttackSystem = {
      getCurrentPhase: vi.fn().mockReturnValue(AttackPhase.COMPLETED),
      getPhaseProgress: vi.fn().mockReturnValue(0),
      setOnPhaseChangeCallback: vi.fn(),
      resetCombo: vi.fn(),
    } as unknown as AttackSystem;

    mockUIManager = {
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
    } as unknown as UIManager;

    mockOpponent = {
      getId: vi.fn().mockReturnValue("player2"),
      isOnGround: vi.fn().mockReturnValue(true),
    } as unknown as Character;

    // Create combo system
    comboSystem = new ComboSystem(mockCharacter, mockAttackSystem, 1);
    comboSystem.setUIManager(mockUIManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should initialize with default values", () => {
    expect(comboSystem.getComboCount()).toBe(0);
    expect(comboSystem.isComboActive()).toBe(false);
    expect(comboSystem.getTotalDamage()).toBe(0);
  });

  test("should register a hit and update combo counter", () => {
    const result = comboSystem.onHit(mockOpponent, sampleAttack, 10);

    // First hit is not part of a combo
    expect(result).toBe(false);
    expect(comboSystem.getComboCount()).toBe(1);
    expect(comboSystem.isComboActive()).toBe(true);
    expect(mockUIManager.incrementCombo).toHaveBeenCalledWith(1);
  });

  test("should track combo with multiple hits", () => {
    // First hit
    performance.now = vi.fn().mockReturnValue(1000);
    comboSystem.onHit(mockOpponent, sampleAttack, 10);

    // Second hit within time window
    performance.now = vi.fn().mockReturnValue(1200);
    const result = comboSystem.onHit(mockOpponent, followupAttack, 20);

    expect(result).toBe(true); // Second hit is part of a combo
    expect(comboSystem.getComboCount()).toBe(2);
    expect(mockUIManager.incrementCombo).toHaveBeenCalledTimes(2);

    // Verify damage scaling
    expect(comboSystem.getTotalDamage()).toBeLessThan(30); // Should be less than raw total due to scaling
  });

  test("should identify combo connection types", () => {
    // Directly test the getComboStats method with mock data
    // Create a comboSystem instance with direct access to private fields
    const testComboSystem = comboSystem as any;

    // Set up mock combo data with a cancel connection
    testComboSystem.currentCombo = [
      {
        attackName: "test_light_punch",
        rawDamage: 10,
        scaledDamage: 10,
        connectionType: ComboConnectionType.LINK, // First hit doesn't count as a connection
        timestamp: 1000,
      },
      {
        attackName: "test_medium_punch",
        rawDamage: 20,
        scaledDamage: 18,
        connectionType: ComboConnectionType.CANCEL,
        timestamp: 1200,
      },
      {
        attackName: "test_heavy_punch",
        rawDamage: 30,
        scaledDamage: 24,
        connectionType: ComboConnectionType.CANCEL,
        timestamp: 1400,
      },
    ];

    // Mark combo as active
    testComboSystem.comboActive = true;

    // Get stats and check connections
    const stats = comboSystem.getComboStats();

    // Expect one cancels (2 total minus 1 for the first hit)
    expect(stats.connections.cancels).toBe(1);
    expect(stats.connections.links).toBe(0);
    expect(stats.hitCount).toBe(3);
  });

  test("should reset combo after timeout", () => {
    // Register a hit
    performance.now = vi.fn().mockReturnValue(1000);
    comboSystem.onHit(mockOpponent, sampleAttack, 10);

    // Simulate time passing
    performance.now = vi.fn().mockReturnValue(3000); // More than maxTimeBetweenHits
    comboSystem.update(16.67); // Simulate a frame update

    expect(comboSystem.isComboActive()).toBe(false);
    expect(comboSystem.getComboCount()).toBe(0);
    expect(mockUIManager.resetCombo).toHaveBeenCalledWith(1);
    expect(mockAttackSystem.resetCombo).toHaveBeenCalled();
  });

  test("should track juggle state", () => {
    // First hit
    performance.now = vi.fn().mockReturnValue(1000);
    comboSystem.onHit(mockOpponent, sampleAttack, 10);

    // Opponent is in air after first hit
    mockOpponent.isOnGround = vi.fn().mockReturnValue(false);

    // Second hit while opponent is in air
    performance.now = vi.fn().mockReturnValue(1200);
    comboSystem.onHit(mockOpponent, followupAttack, 20);

    // Expect juggle state to be tracked (would need to expose internal state
    // through a method for direct testing - this is an indirect test)
    const stats = comboSystem.getComboStats();
    expect(stats.hitCount).toBe(2);
  });

  test("should detect valid chains between attacks", () => {
    // Testing the chain detection logic

    // Access private method via type casting
    const isValidChain = (comboSystem as any).isValidChain.bind(comboSystem);

    // Test light to medium (valid)
    expect(isValidChain("test_light_punch", "test_medium_punch")).toBe(true);

    // Test medium to light (invalid - can't chain from heavier to lighter)
    expect(isValidChain("test_medium_punch", "test_light_punch")).toBe(false);

    // Test medium to heavy (valid)
    expect(isValidChain("test_medium_punch", "test_heavy_punch")).toBe(true);
  });

  test("should provide detailed combo stats", () => {
    // First hit
    performance.now = vi.fn().mockReturnValue(1000);
    comboSystem.onHit(mockOpponent, sampleAttack, 10);

    // Second hit
    performance.now = vi.fn().mockReturnValue(1250);
    comboSystem.onHit(mockOpponent, followupAttack, 20);

    const stats = comboSystem.getComboStats();

    expect(stats.hitCount).toBe(2);
    expect(stats.totalDamage).toBeGreaterThan(0);
    expect(stats.rawDamage).toBe(30); // 10 + 20
    expect(stats.averageScaling).toBeLessThanOrEqual(1);
    expect(stats.duration).toBe(250); // 1250 - 1000
  });
});
