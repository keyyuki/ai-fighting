import { GameUIManager } from "../GameUIManager";
import { MockHealthBar } from "./MockHealthBar";
import { MockComboCounter } from "./MockComboCounter";
import { MockRoundIndicator } from "./MockRoundIndicator";
import { MockTimer } from "./MockTimer";

/**
 * Test-specific subclass of GameUIManager that uses our mock components
 * instead of real ones and overrides the getter methods to avoid instanceof checks
 */
export class TestGameUIManager extends GameUIManager {
  private mockPlayer1HealthBar: MockHealthBar;
  private mockPlayer2HealthBar: MockHealthBar;
  private mockRoundIndicator: MockRoundIndicator;
  private mockTimer: MockTimer;
  private mockPlayer1ComboCounter: MockComboCounter;
  private mockPlayer2ComboCounter: MockComboCounter;

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    totalRounds: number = 3
  ) {
    super(canvasWidth, canvasHeight, totalRounds);

    // Create mock instances
    this.mockPlayer1HealthBar = new MockHealthBar(20, 20, 400, 30, 100, 1);
    this.mockPlayer2HealthBar = new MockHealthBar(780, 20, 400, 30, 100, 2);
    this.mockRoundIndicator = new MockRoundIndicator(
      500,
      20,
      200,
      50,
      totalRounds
    );
    this.mockTimer = new MockTimer(550, 20, 100, 50, 99);
    this.mockPlayer1ComboCounter = new MockComboCounter(20, 700, 150, 60, 1);
    this.mockPlayer2ComboCounter = new MockComboCounter(1030, 700, 150, 60, 2);

    // Replace setupGameUI with a version that uses our mocks
    this.setupGameUI();
  }

  /**
   * Override setupGameUI to use mock components instead of real ones
   */
  public override setupGameUI(): void {
    // Initialize components map if it doesn't exist
    if (!(this as any).components) {
      (this as any).components = new Map();
    }

    // Set mock components in the map
    (this as any).components.set("player1HealthBar", this.mockPlayer1HealthBar);
    (this as any).components.set("player2HealthBar", this.mockPlayer2HealthBar);
    (this as any).components.set("roundIndicator", this.mockRoundIndicator);
    (this as any).components.set("timer", this.mockTimer);
    (this as any).components.set(
      "player1ComboCounter",
      this.mockPlayer1ComboCounter
    );
    (this as any).components.set(
      "player2ComboCounter",
      this.mockPlayer2ComboCounter
    );
  }

  /**
   * Override getHealthBars to return our mock objects directly
   */
  public override getHealthBars() {
    return {
      player1: this.mockPlayer1HealthBar,
      player2: this.mockPlayer2HealthBar,
    };
  }

  /**
   * Override getTimer to return our mock timer directly
   */
  public override getTimer() {
    return this.mockTimer;
  }

  /**
   * Override getRoundIndicator to return our mock round indicator directly
   */
  public override getRoundIndicator() {
    return this.mockRoundIndicator;
  }

  /**
   * Override getComboCounters to return our mock combo counters directly
   */
  public override getComboCounters() {
    return {
      player1: this.mockPlayer1ComboCounter,
      player2: this.mockPlayer2ComboCounter,
    };
  }

  /**
   * Get access to the mock components for testing
   */
  public getMocks() {
    return {
      player1HealthBar: this.mockPlayer1HealthBar,
      player2HealthBar: this.mockPlayer2HealthBar,
      roundIndicator: this.mockRoundIndicator,
      timer: this.mockTimer,
      player1ComboCounter: this.mockPlayer1ComboCounter,
      player2ComboCounter: this.mockPlayer2ComboCounter,
    };
  }
}
