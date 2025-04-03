import { UIComponent } from "./UIComponent";
import { HealthBar } from "./HealthBar";
import { Timer } from "./Timer";
import { RoundIndicator } from "./RoundIndicator";
import { ComboCounter } from "./ComboCounter";

/**
 * Manages game-specific UI components like health bars, timer, round indicators
 */
export class GameUIManager {
  private components: Map<string, UIComponent>;
  private canvasWidth: number;
  private canvasHeight: number;
  private totalRounds: number;

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    totalRounds: number = 3
  ) {
    this.components = new Map<string, UIComponent>();
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.totalRounds = totalRounds;
  }

  /**
   * Set up game UI with default components for fighting game
   */
  public setupGameUI(maxHealth: number = 100, roundTime: number = 99): void {
    const canvasWidth = this.canvasWidth;
    const canvasHeight = this.canvasHeight;

    // Create health bars for both players
    const healthBarHeight = 30;
    const healthBarWidth = canvasWidth * 0.4; // 40% of screen width
    const healthBarMargin = 20;

    // Player 1 health bar (left side)
    const player1HealthBar = new HealthBar(
      healthBarMargin,
      healthBarMargin,
      healthBarWidth,
      healthBarHeight,
      maxHealth,
      1
    );

    // Player 2 health bar (right side)
    const player2HealthBar = new HealthBar(
      canvasWidth - healthBarWidth - healthBarMargin,
      healthBarMargin,
      healthBarWidth,
      healthBarHeight,
      maxHealth,
      2
    );

    // Round timer (center top)
    const timerWidth = 100;
    const timerHeight = 50;
    const timer = new Timer(
      (canvasWidth - timerWidth) / 2,
      healthBarMargin,
      timerWidth,
      timerHeight,
      roundTime
    );

    // Round indicator (center, below timer)
    const roundIndicatorWidth = 200;
    const roundIndicatorHeight = 50;
    const roundIndicator = new RoundIndicator(
      (canvasWidth - roundIndicatorWidth) / 2,
      healthBarMargin + timerHeight + 5,
      roundIndicatorWidth,
      roundIndicatorHeight,
      this.totalRounds
    );

    // Combo counters for both players
    const comboCounterWidth = 150;
    const comboCounterHeight = 60;

    // Player 1 combo counter (left side)
    const player1ComboCounter = new ComboCounter(
      healthBarMargin,
      canvasHeight - comboCounterHeight - 50,
      comboCounterWidth,
      comboCounterHeight,
      1
    );

    // Player 2 combo counter (right side)
    const player2ComboCounter = new ComboCounter(
      canvasWidth - comboCounterWidth - healthBarMargin,
      canvasHeight - comboCounterHeight - 50,
      comboCounterWidth,
      comboCounterHeight,
      2
    );

    // Add all components to the manager
    this.components.set("player1HealthBar", player1HealthBar);
    this.components.set("player2HealthBar", player2HealthBar);
    this.components.set("timer", timer);
    this.components.set("roundIndicator", roundIndicator);
    this.components.set("player1ComboCounter", player1ComboCounter);
    this.components.set("player2ComboCounter", player2ComboCounter);

    // Set initial visibility (hidden until gameplay starts)
    player1HealthBar.setVisible(false);
    player2HealthBar.setVisible(false);
    timer.setVisible(false);
    roundIndicator.setVisible(false);
    player1ComboCounter.setVisible(false);
    player2ComboCounter.setVisible(false);
  }

  /**
   * Set the total number of rounds for the match
   */
  public setTotalRounds(totalRounds: number): void {
    this.totalRounds = totalRounds;
    const roundIndicator = this.getRoundIndicator();
    if (roundIndicator) {
      roundIndicator.setTotalRounds(totalRounds);
    }
  }

  /**
   * Add hit to combo counter for given player
   * @param playerNumber Player 1 or 2
   * @returns New combo count
   */
  public incrementCombo(playerNumber: 1 | 2): number {
    const comboCounters = this.getComboCounters();
    if (!comboCounters) return 0;

    const counter =
      playerNumber === 1 ? comboCounters.player1 : comboCounters.player2;
    return counter.incrementCombo();
  }

  /**
   * Reset combo counter for given player
   * @param playerNumber Player 1 or 2
   */
  public resetCombo(playerNumber: 1 | 2): void {
    const comboCounters = this.getComboCounters();
    if (!comboCounters) return;

    const counter =
      playerNumber === 1 ? comboCounters.player1 : comboCounters.player2;
    counter.resetCombo();
  }

  /**
   * Add round win for given player
   * @param playerNumber Player 1 or 2
   * @returns New win count
   */
  public addRoundWin(playerNumber: 1 | 2): number {
    const roundIndicator = this.getRoundIndicator();
    if (!roundIndicator) return 0;

    return roundIndicator.addPlayerWin(playerNumber);
  }

  /**
   * Start a new round
   * @param roundNumber Round number to start
   */
  public startRound(roundNumber: number): void {
    const roundIndicator = this.getRoundIndicator();
    if (!roundIndicator) return;

    roundIndicator.startRound(roundNumber);

    // Reset combo counters
    const comboCounters = this.getComboCounters();
    if (comboCounters) {
      comboCounters.player1.resetCombo();
      comboCounters.player2.resetCombo();
    }

    // Reset timer
    const timer = this.getTimer();
    if (timer) {
      timer.reset();
      timer.start();
    }
  }

  /**
   * Check if player has won the match
   * @param playerNumber Player 1 or 2
   * @returns True if player has won enough rounds
   */
  public isMatchWinner(playerNumber: 1 | 2): boolean {
    const roundIndicator = this.getRoundIndicator();
    if (!roundIndicator) return false;

    return roundIndicator.isMatchWinner(playerNumber);
  }

  /**
   * Convenience method to get the player health bars
   */
  public getHealthBars(): { player1: HealthBar; player2: HealthBar } | null {
    const p1HealthBar = this.components.get("player1HealthBar");
    const p2HealthBar = this.components.get("player2HealthBar");

    // Removed instanceof check - if the components exist and have the expected methods, use them
    if (
      p1HealthBar &&
      p2HealthBar &&
      "setHealth" in p1HealthBar &&
      "setHealth" in p2HealthBar
    ) {
      return {
        player1: p1HealthBar as HealthBar,
        player2: p2HealthBar as HealthBar,
      };
    }

    return null;
  }

  /**
   * Convenience method to get the timer
   */
  public getTimer(): Timer | null {
    const timer = this.components.get("timer");

    // Removed instanceof check - if the component exists and has the expected methods, use it
    if (timer && "start" in timer && "reset" in timer) {
      return timer as Timer;
    }

    return null;
  }

  /**
   * Convenience method to get the round indicator
   */
  public getRoundIndicator(): RoundIndicator | null {
    const roundIndicator = this.components.get("roundIndicator");

    // Removed instanceof check - if the component exists and has the expected methods, use it
    if (
      roundIndicator &&
      "startRound" in roundIndicator &&
      "addPlayerWin" in roundIndicator
    ) {
      return roundIndicator as RoundIndicator;
    }

    return null;
  }

  /**
   * Convenience method to get the combo counters
   */
  public getComboCounters(): {
    player1: ComboCounter;
    player2: ComboCounter;
  } | null {
    const p1ComboCounter = this.components.get("player1ComboCounter");
    const p2ComboCounter = this.components.get("player2ComboCounter");

    // Removed instanceof check - if the components exist and have the expected methods, use them
    if (
      p1ComboCounter &&
      p2ComboCounter &&
      "incrementCombo" in p1ComboCounter &&
      "incrementCombo" in p2ComboCounter
    ) {
      return {
        player1: p1ComboCounter as ComboCounter,
        player2: p2ComboCounter as ComboCounter,
      };
    }

    return null;
  }

  /**
   * Update canvas dimensions and recreate UI components
   */
  public handleResize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.setupGameUI();
  }
}
