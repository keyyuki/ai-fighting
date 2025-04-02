import { describe, test, expect, beforeEach, vi, SpyInstance } from "vitest";
import { GameUIManager } from "./GameUIManager";
import { RoundIndicator } from "./RoundIndicator";
import { ComboCounter } from "./ComboCounter";
import { HealthBar } from "./HealthBar";

// Create proper mocks for the UI components
vi.mock("./RoundIndicator", () => {
  const MockRoundIndicator = vi.fn().mockImplementation(() => ({
    setTotalRounds: vi.fn(),
    addPlayerWin: vi.fn().mockReturnValue(1),
    startRound: vi.fn(),
    isMatchWinner: vi.fn().mockImplementation((playerNum) => playerNum === 1),
    update: vi.fn(),
    render: vi.fn(),
    setVisible: vi.fn(),
    isVisible: vi.fn().mockReturnValue(true),
    getPosition: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    getSize: vi.fn().mockReturnValue({ width: 200, height: 50 }),
    getX: vi.fn().mockReturnValue(0),
    getY: vi.fn().mockReturnValue(0),
    getWidth: vi.fn().mockReturnValue(200),
    getHeight: vi.fn().mockReturnValue(50),
  }));
  return { RoundIndicator: MockRoundIndicator };
});

vi.mock("./ComboCounter", () => {
  const MockComboCounter = vi.fn().mockImplementation(() => ({
    incrementCombo: vi.fn().mockReturnValue(1),
    resetCombo: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
    setVisible: vi.fn(),
    isVisible: vi.fn().mockReturnValue(true),
    getPosition: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    getSize: vi.fn().mockReturnValue({ width: 100, height: 50 }),
    getX: vi.fn().mockReturnValue(0),
    getY: vi.fn().mockReturnValue(0),
    getWidth: vi.fn().mockReturnValue(100),
    getHeight: vi.fn().mockReturnValue(50),
  }));
  return { ComboCounter: MockComboCounter };
});

vi.mock("./HealthBar", () => {
  const MockHealthBar = vi.fn().mockImplementation(() => ({
    setHealth: vi.fn(),
    getHealth: vi.fn().mockReturnValue(100),
    update: vi.fn(),
    render: vi.fn(),
    setVisible: vi.fn(),
    isVisible: vi.fn().mockReturnValue(true),
    getPosition: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    getSize: vi.fn().mockReturnValue({ width: 200, height: 30 }),
    getX: vi.fn().mockReturnValue(0),
    getY: vi.fn().mockReturnValue(0),
    getWidth: vi.fn().mockReturnValue(200),
    getHeight: vi.fn().mockReturnValue(30),
  }));
  return { HealthBar: MockHealthBar };
});

// Now we're importing the mocked versions
const MockRoundIndicator = vi.mocked(RoundIndicator);
const MockComboCounter = vi.mocked(ComboCounter);
const MockHealthBar = vi.mocked(HealthBar);

describe("GameUIManager", () => {
  let gameUIManager: GameUIManager;
  let mockContext: CanvasRenderingContext2D;
  let roundIndicator: any;
  let player1ComboCounter: any;
  let player2ComboCounter: any;
  let player1HealthBar: any;
  let player2HealthBar: any;
  const canvasWidth = 1200;
  const canvasHeight = 800;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Setup mock canvas context
    mockContext = {
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      rect: vi.fn(),
      roundRect: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      textAlign: "center" as CanvasTextAlign,
      textBaseline: "top" as CanvasTextBaseline,
      font: "",
      globalAlpha: 1,
      canvas: {
        width: canvasWidth,
        height: canvasHeight,
      },
      measureText: vi.fn().mockReturnValue({ width: 50 }),
    } as unknown as CanvasRenderingContext2D;

    // Create a new game UI manager
    gameUIManager = new GameUIManager(canvasWidth, canvasHeight);

    // Create individual component mocks for access in tests
    roundIndicator = {
      setTotalRounds: vi.fn(),
      addPlayerWin: vi.fn().mockReturnValue(1),
      startRound: vi.fn(),
      isMatchWinner: vi.fn().mockImplementation((playerNum) => playerNum === 1),
      update: vi.fn(),
      render: vi.fn(),
      setVisible: vi.fn(),
      isVisible: vi.fn().mockReturnValue(true),
    };

    player1ComboCounter = {
      incrementCombo: vi.fn().mockReturnValue(1),
      resetCombo: vi.fn(),
      update: vi.fn(),
      render: vi.fn(),
    };

    player2ComboCounter = {
      incrementCombo: vi.fn().mockReturnValue(1),
      resetCombo: vi.fn(),
      update: vi.fn(),
      render: vi.fn(),
    };

    player1HealthBar = {
      setHealth: vi.fn(),
      getHealth: vi.fn().mockReturnValue(100),
      update: vi.fn(),
      render: vi.fn(),
    };

    player2HealthBar = {
      setHealth: vi.fn(),
      getHealth: vi.fn().mockReturnValue(100),
      update: vi.fn(),
      render: vi.fn(),
    };

    // Add components to the manager's component map
    (gameUIManager as any).components = new Map();
    (gameUIManager as any).components.set("roundIndicator", roundIndicator);
    (gameUIManager as any).components.set(
      "player1ComboCounter",
      player1ComboCounter
    );
    (gameUIManager as any).components.set(
      "player2ComboCounter",
      player2ComboCounter
    );
    (gameUIManager as any).components.set("player1HealthBar", player1HealthBar);
    (gameUIManager as any).components.set("player2HealthBar", player2HealthBar);
  });

  test("setupGameUI creates all required UI components", () => {
    const newGameUIManager = new GameUIManager(canvasWidth, canvasHeight);
    newGameUIManager.setupGameUI();

    // Check that required mocks were called during setup
    expect(MockRoundIndicator).toHaveBeenCalled();
    expect(MockComboCounter).toHaveBeenCalledTimes(2);
    expect(MockHealthBar).toHaveBeenCalledTimes(2);

    // Check that components map has all needed entries
    const componentsMap = (newGameUIManager as any).components;
    expect(componentsMap.has("roundIndicator")).toBe(true);
    expect(componentsMap.has("player1ComboCounter")).toBe(true);
    expect(componentsMap.has("player2ComboCounter")).toBe(true);
    expect(componentsMap.has("player1HealthBar")).toBe(true);
    expect(componentsMap.has("player2HealthBar")).toBe(true);
  });

  test("setTotalRounds updates the round indicator", () => {
    // Call the method
    gameUIManager.setTotalRounds(5);

    // Check the round indicator's method was called
    expect(roundIndicator.setTotalRounds).toHaveBeenCalledWith(5);
  });

  test("incrementCombo increases combo count for specified player", () => {
    // Test player 1 combo
    const result1 = gameUIManager.incrementCombo(1);
    expect(player1ComboCounter.incrementCombo).toHaveBeenCalledTimes(1);
    expect(result1).toBe(1); // Mock returns 1

    // Test player 2 combo
    const result2 = gameUIManager.incrementCombo(2);
    expect(player2ComboCounter.incrementCombo).toHaveBeenCalledTimes(1);
    expect(result2).toBe(1);
  });

  test("resetCombo resets combo counter for specified player", () => {
    // Test player 1 reset
    gameUIManager.resetCombo(1);
    expect(player1ComboCounter.resetCombo).toHaveBeenCalledTimes(1);

    // Test player 2 reset
    gameUIManager.resetCombo(2);
    expect(player2ComboCounter.resetCombo).toHaveBeenCalledTimes(1);
  });

  test("addRoundWin increases win count for specified player", () => {
    // Test player 1 win
    const result1 = gameUIManager.addRoundWin(1);
    expect(roundIndicator.addPlayerWin).toHaveBeenCalledWith(1);
    expect(result1).toBe(1); // Mock returns 1

    // Test player 2 win
    const result2 = gameUIManager.addRoundWin(2);
    expect(roundIndicator.addPlayerWin).toHaveBeenCalledWith(2);
    expect(result2).toBe(1);
  });

  test("startRound starts a new round with correct round number", () => {
    // Mock current round
    (gameUIManager as any).currentRound = 1;

    // Start next round (should be round 2)
    gameUIManager.startRound();

    // Verify round indicator updated
    expect(roundIndicator.startRound).toHaveBeenCalledWith(2);

    // Verify combos reset
    expect(player1ComboCounter.resetCombo).toHaveBeenCalled();
    expect(player2ComboCounter.resetCombo).toHaveBeenCalled();

    // Verify current round increased
    expect((gameUIManager as any).currentRound).toBe(2);
  });

  test("isMatchWinner delegates to round indicator", () => {
    roundIndicator.isMatchWinner.mockImplementation(
      (playerNum) => playerNum === 1
    );

    // Test player 1 (should be winner)
    expect(gameUIManager.isMatchWinner(1)).toBe(true);

    // Test player 2 (should not be winner)
    expect(gameUIManager.isMatchWinner(2)).toBe(false);

    // Verify roundIndicator method was called
    expect(roundIndicator.isMatchWinner).toHaveBeenCalledWith(1);
    expect(roundIndicator.isMatchWinner).toHaveBeenCalledWith(2);
  });

  test("getHealthBars returns both health bars", () => {
    const healthBars = gameUIManager.getHealthBars();

    // Verify both health bars are returned
    expect(healthBars).not.toBeNull();
    expect(healthBars?.player1).toBeDefined();
    expect(healthBars?.player2).toBeDefined();
    expect(healthBars?.player1).toBe(player1HealthBar);
    expect(healthBars?.player2).toBe(player2HealthBar);
  });

  test("handleResize updates dimensions and recreates UI components", () => {
    const newWidth = 1600;
    const newHeight = 900;

    // Spy on setupGameUI
    const setupGameUISpy = vi.spyOn(gameUIManager, "setupGameUI");

    // Call handleResize with new dimensions
    gameUIManager.handleResize(newWidth, newHeight);

    // Verify width and height updated
    expect((gameUIManager as any).width).toBe(newWidth);
    expect((gameUIManager as any).height).toBe(newHeight);

    // Verify UI was recreated
    expect(setupGameUISpy).toHaveBeenCalled();
  });
});
