import { describe, test, expect, beforeEach, vi } from "vitest";
import { RoundSystem } from "./RoundSystem";
import { UIManager } from "../../ui/UIManager";

// Mock UIManager for testing purposes
vi.mock("../../ui/UIManager", () => {
  return {
    UIManager: vi.fn().mockImplementation(() => ({
      startRound: vi.fn(),
      addRoundWin: vi.fn().mockReturnValue(1),
      getHealthBars: vi.fn().mockReturnValue({
        player1: { getHealthPercentage: vi.fn().mockReturnValue(75) },
        player2: { getHealthPercentage: vi.fn().mockReturnValue(50) },
      }),
      getTimer: vi.fn().mockReturnValue({
        getTimeRemaining: vi.fn().mockReturnValue(30),
        setDuration: vi.fn(),
        start: vi.fn(),
        pause: vi.fn(),
        reset: vi.fn(),
        getRoundTime: vi.fn().mockReturnValue(99),
      }),
      isMatchWinner: vi.fn().mockImplementation((playerNum) => {
        // Simulate match winner logic - Player needs 2 wins to win a best of 3
        if (playerNum === 1) {
          return mockPlayer1Wins >= 2;
        } else {
          return mockPlayer2Wins >= 2;
        }
      }),
      setTotalRounds: vi.fn(),
    })),
  };
});

// Keep track of mock win state
let mockPlayer1Wins = 0;
let mockPlayer2Wins = 0;

describe("RoundSystem", () => {
  let roundSystem: RoundSystem;
  let mockUIManager: UIManager;

  beforeEach(() => {
    // Reset mock win state
    mockPlayer1Wins = 0;
    mockPlayer2Wins = 0;

    // Create mocked UIManager without relying on document
    mockUIManager = new UIManager({} as HTMLCanvasElement);
    roundSystem = new RoundSystem(mockUIManager);

    // Configure the addRoundWin mock to update our mock state
    (mockUIManager.addRoundWin as jest.Mock).mockImplementation((playerNum) => {
      if (playerNum === 1) {
        return ++mockPlayer1Wins;
      } else {
        return ++mockPlayer2Wins;
      }
    });
  });

  test("should initialize with default values", () => {
    expect(roundSystem.getCurrentRound()).toBe(1);
    expect(roundSystem.getTotalRounds()).toBe(3);
    expect(roundSystem.getPlayerRoundWins(1)).toBe(0);
    expect(roundSystem.getPlayerRoundWins(2)).toBe(0);
  });

  test("should start a new round", () => {
    roundSystem.startRound(2);
    expect(roundSystem.getCurrentRound()).toBe(2);
    expect(mockUIManager.startRound).toHaveBeenCalledWith(2);
  });

  test("should end round and track player wins", () => {
    const isMatchOver = roundSystem.endRound(1);
    expect(isMatchOver).toBe(false);
    expect(roundSystem.getPlayerRoundWins(1)).toBe(1);
    expect(mockUIManager.addRoundWin).toHaveBeenCalledWith(1);

    // Second win for player 1 (2 out of 3)
    const secondRoundResult = roundSystem.endRound(1);
    expect(secondRoundResult).toBe(true); // Match should be over
    expect(roundSystem.isMatchWinner(1)).toBe(true);
    expect(roundSystem.isMatchWinner(2)).toBe(false);
  });

  test("should reset to initial state", () => {
    roundSystem.endRound(1); // Add a win for player 1
    roundSystem.startRound(2); // Start the next round

    roundSystem.reset();
    expect(roundSystem.getCurrentRound()).toBe(1);
    expect(roundSystem.getPlayerRoundWins(1)).toBe(0);
    expect(roundSystem.getPlayerRoundWins(2)).toBe(0);
  });

  test("should handle time expiry based on player health", () => {
    // Mock health percentages: player1=75%, player2=50%
    const winner = roundSystem.handleTimeExpiry();
    expect(winner).toBe(1); // Player 1 has more health
  });

  test("should handle draw when health is equal", () => {
    // Mock equal health
    (mockUIManager.getHealthBars as jest.Mock).mockReturnValue({
      player1: { getHealthPercentage: vi.fn().mockReturnValue(50) },
      player2: { getHealthPercentage: vi.fn().mockReturnValue(50) },
    });

    const winner = roundSystem.handleTimeExpiry();
    expect(winner).toBe(0); // Draw
  });

  test("should update round duration", () => {
    const timer = mockUIManager.getTimer();
    roundSystem.setRoundDuration(60);
    expect(timer.setDuration).toHaveBeenCalledWith(60);
  });

  test("should set total rounds", () => {
    roundSystem.setTotalRounds(5);
    expect(roundSystem.getTotalRounds()).toBe(5);
    expect(mockUIManager.setTotalRounds).toHaveBeenCalledWith(5);
  });

  test("should return round time remaining", () => {
    expect(roundSystem.getRoundTimeRemaining()).toBe(30);
  });

  test("should advance to next round after ending current round", () => {
    const isMatchOver = roundSystem.endRound(2);
    expect(isMatchOver).toBe(false);
    expect(roundSystem.getCurrentRound()).toBe(2); // Should be ready for round 2
  });
});
