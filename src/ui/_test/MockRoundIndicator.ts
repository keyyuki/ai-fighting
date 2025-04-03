import { UIComponent } from "../UIComponent";
import { vi } from "vitest";
import { RoundIndicator } from "../RoundIndicator";

/**
 * Mock implementation of RoundIndicator for testing
 * This extends UIComponent directly to avoid recursion with mocked RoundIndicator
 */
export class MockRoundIndicator extends UIComponent {
  startRound: ReturnType<typeof vi.fn>;
  setPlayerWins: ReturnType<typeof vi.fn>;
  addPlayerWin: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  isMatchWinner: ReturnType<typeof vi.fn>;
  setColors: ReturnType<typeof vi.fn>;
  getCurrentRound: ReturnType<typeof vi.fn>;
  getTotalRounds: ReturnType<typeof vi.fn>;
  getPlayerWins: ReturnType<typeof vi.fn>;
  setTotalRounds: ReturnType<typeof vi.fn>;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    totalRounds: number = 3
  ) {
    super(x, y, width, height);

    // Mock all methods specific to RoundIndicator
    this.startRound = vi.fn();
    this.setPlayerWins = vi.fn();
    this.addPlayerWin = vi.fn().mockReturnValue(1);
    this.reset = vi.fn();
    this.isMatchWinner = vi
      .fn()
      .mockImplementation((playerNum) => playerNum === 1);
    this.setColors = vi.fn();
    this.getCurrentRound = vi.fn().mockReturnValue(1);
    this.getTotalRounds = vi.fn().mockReturnValue(totalRounds);
    this.getPlayerWins = vi.fn().mockReturnValue(0);
    this.setTotalRounds = vi.fn();

    // Override UIComponent methods with mocks
    this.update = vi.fn();
    this.render = vi.fn();
    this.setVisible = vi.fn();
    this.isVisible = vi.fn().mockReturnValue(true);
    this.setPosition = vi.fn();
    this.setSize = vi.fn();
    this.getPosition = vi.fn().mockReturnValue({ x, y });
    this.getSize = vi.fn().mockReturnValue({ width, height });
    this.getX = vi.fn().mockReturnValue(x);
    this.getY = vi.fn().mockReturnValue(y);
    this.getWidth = vi.fn().mockReturnValue(width);
    this.getHeight = vi.fn().mockReturnValue(height);
    this.containsPoint = vi.fn().mockReturnValue(false);
  }
}

// Make sure instanceof checks work with this mock
Object.defineProperty(MockRoundIndicator.prototype, Symbol.hasInstance, {
  value: (instance: any) => {
    return (
      instance instanceof UIComponent ||
      instance instanceof RoundIndicator ||
      instance instanceof MockRoundIndicator
    );
  },
});
