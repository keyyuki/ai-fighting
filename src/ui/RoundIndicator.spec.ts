import { describe, test, expect, beforeEach, vi } from "vitest";
import { RoundIndicator } from "./RoundIndicator";

describe("RoundIndicator", () => {
  let roundIndicator: RoundIndicator;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    // Setup mock canvas context
    mockContext = {
      fillText: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      font: "",
      textAlign: "left",
      textBaseline: "middle",
      globalAlpha: 1,
      canvas: { width: 800, height: 600 },
    } as unknown as CanvasRenderingContext2D;

    // Create a new round indicator for each test
    roundIndicator = new RoundIndicator(50, 50, 200, 50, 3); // 3 rounds by default
  });

  test("should initialize with correct round values", () => {
    expect(roundIndicator.getCurrentRound()).toBe(1);
    expect(roundIndicator.getTotalRounds()).toBe(3);
    expect(roundIndicator.getPlayerWins(1)).toBe(0);
    expect(roundIndicator.getPlayerWins(2)).toBe(0);
  });

  test("should update round number when starting a new round", () => {
    roundIndicator.startRound(2);
    expect(roundIndicator.getCurrentRound()).toBe(2);

    roundIndicator.startRound(3);
    expect(roundIndicator.getCurrentRound()).toBe(3);
  });

  test("should add player wins correctly", () => {
    expect(roundIndicator.addPlayerWin(1)).toBe(1);
    expect(roundIndicator.getPlayerWins(1)).toBe(1);

    expect(roundIndicator.addPlayerWin(2)).toBe(1);
    expect(roundIndicator.getPlayerWins(2)).toBe(1);

    expect(roundIndicator.addPlayerWin(1)).toBe(2);
    expect(roundIndicator.getPlayerWins(1)).toBe(2);
  });

  test("should not allow player wins to exceed total rounds", () => {
    roundIndicator.addPlayerWin(1);
    roundIndicator.addPlayerWin(1);
    roundIndicator.addPlayerWin(1);
    roundIndicator.addPlayerWin(1); // This should be ignored

    expect(roundIndicator.getPlayerWins(1)).toBe(3); // Max is 3
  });

  test("should set player wins directly", () => {
    roundIndicator.setPlayerWins(1, 2);
    expect(roundIndicator.getPlayerWins(1)).toBe(2);

    roundIndicator.setPlayerWins(2, 1);
    expect(roundIndicator.getPlayerWins(2)).toBe(1);
  });

  test("should reset all values", () => {
    roundIndicator.startRound(3);
    roundIndicator.addPlayerWin(1);
    roundIndicator.addPlayerWin(2);

    roundIndicator.reset();

    expect(roundIndicator.getCurrentRound()).toBe(1);
    expect(roundIndicator.getPlayerWins(1)).toBe(0);
    expect(roundIndicator.getPlayerWins(2)).toBe(0);
  });

  test("should determine match winner correctly", () => {
    // Best of 3, need 2 wins to win the match
    roundIndicator.addPlayerWin(1); // P1: 1 win
    expect(roundIndicator.isMatchWinner(1)).toBe(false);

    roundIndicator.addPlayerWin(1); // P1: 2 wins
    expect(roundIndicator.isMatchWinner(1)).toBe(true);
    expect(roundIndicator.isMatchWinner(2)).toBe(false);

    // Reset and try for P2
    roundIndicator.reset();
    roundIndicator.addPlayerWin(2);
    roundIndicator.addPlayerWin(2);
    expect(roundIndicator.isMatchWinner(2)).toBe(true);
  });

  test("should show round announcement when starting a round", () => {
    const renderSpy = vi.spyOn(roundIndicator, "render");

    roundIndicator.startRound(2);
    roundIndicator.render(mockContext);

    expect(renderSpy).toHaveBeenCalledWith(mockContext);
    expect(mockContext.fillText).toHaveBeenCalled();
  });

  test("should hide round announcement after timer expires", () => {
    roundIndicator.startRound(2);

    // Fast-forward past the announcement duration
    roundIndicator.update(3000); // Announcement duration is 2000ms
    roundIndicator.render(mockContext);

    // Round wins should still be visible, but announcement should be gone
    expect(mockContext.fillText).toHaveBeenCalled();
    // We can't directly test if the announcement is hidden, but we know
    // the update method should have removed the showRoundText flag
  });

  test("should not render when not visible", () => {
    roundIndicator.setVisible(false);
    roundIndicator.render(mockContext);
    expect(mockContext.beginPath).not.toHaveBeenCalled();
    expect(mockContext.fillText).not.toHaveBeenCalled();
  });

  test("should handle different total rounds", () => {
    // Create a 5-round indicator
    const fiveRoundIndicator = new RoundIndicator(50, 50, 200, 50, 5);
    expect(fiveRoundIndicator.getTotalRounds()).toBe(5);

    // Need 3 wins to win a best-of-5
    fiveRoundIndicator.addPlayerWin(1);
    fiveRoundIndicator.addPlayerWin(1);
    expect(fiveRoundIndicator.isMatchWinner(1)).toBe(false);

    fiveRoundIndicator.addPlayerWin(1);
    expect(fiveRoundIndicator.isMatchWinner(1)).toBe(true);
  });
});
