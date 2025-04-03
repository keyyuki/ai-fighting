import { IRoundSystem } from "./interface/IRoundSystem";
import { UIManager } from "../../ui/UIManager";
import { GameState } from "../../ui/UIManager";

/**
 * System for managing round state and progression in a fighting game
 * Handles round transitions, victory conditions, and timers
 */
export class RoundSystem implements IRoundSystem {
  private currentRound: number = 1;
  private totalRounds: number = 3; // Default is best of 3
  private player1Wins: number = 0;
  private player2Wins: number = 0;
  private roundDuration: number = 99; // Default 99 seconds per round
  private uiManager: UIManager;

  /**
   * Create a new RoundSystem
   * @param uiManager UI manager for accessing UI components and state
   */
  constructor(uiManager: UIManager) {
    this.uiManager = uiManager;
  }

  /**
   * Start a new round
   * @param roundNumber Round number to start
   */
  public startRound(roundNumber: number): void {
    this.currentRound = roundNumber;
    this.uiManager.startRound(roundNumber);

    // Get the timer and reset/start it
    const timer = this.uiManager.getTimer();
    if (timer) {
      timer.reset();
      timer.start();
    }
  }

  /**
   * End the current round and determine winner
   * @param winnerPlayerNumber The player number who won (1 or 2)
   * @returns True if the match has ended, false if more rounds remain
   */
  public endRound(winnerPlayerNumber: 1 | 2): boolean {
    // Add win to the player's count
    if (winnerPlayerNumber === 1) {
      this.player1Wins++;
    } else {
      this.player2Wins++;
    }

    // Update UI
    this.uiManager.addRoundWin(winnerPlayerNumber);

    // Check if the match is over
    if (this.isMatchWinner(1) || this.isMatchWinner(2)) {
      return true; // Match over
    }

    // Prepare for next round
    this.currentRound++;
    return false; // Match continues
  }

  /**
   * Reset the round system to its initial state
   */
  public reset(): void {
    this.currentRound = 1;
    this.player1Wins = 0;
    this.player2Wins = 0;

    // Reset UI components
    const timer = this.uiManager.getTimer();
    if (timer) {
      timer.reset();
    }

    // Round indicator resets with startRound(1) via UI Manager
    this.uiManager.startRound(1);
  }

  /**
   * Get the current round number
   */
  public getCurrentRound(): number {
    return this.currentRound;
  }

  /**
   * Get the total number of rounds in the match
   */
  public getTotalRounds(): number {
    return this.totalRounds;
  }

  /**
   * Set the total number of rounds for the match
   * @param rounds The new total number of rounds
   */
  public setTotalRounds(rounds: number): void {
    this.totalRounds = rounds;

    // Update UI system
    this.uiManager.setTotalRounds(rounds);
  }

  /**
   * Get the number of rounds won by a player
   * @param playerNumber The player number (1 or 2)
   */
  public getPlayerRoundWins(playerNumber: 1 | 2): number {
    return playerNumber === 1 ? this.player1Wins : this.player2Wins;
  }

  /**
   * Check if a player has won the match
   * @param playerNumber The player number to check (1 or 2)
   */
  public isMatchWinner(playerNumber: 1 | 2): boolean {
    // Use the UI manager's match winner logic (supports odd or even round totals)
    return this.uiManager.isMatchWinner(playerNumber);
  }

  /**
   * Get the time remaining in the current round
   */
  public getRoundTimeRemaining(): number {
    const timer = this.uiManager.getTimer();
    if (timer) {
      return timer.getTimeRemaining();
    }
    return 0;
  }

  /**
   * Set the duration for each round in seconds
   * @param seconds Round duration in seconds
   */
  public setRoundDuration(seconds: number): void {
    this.roundDuration = seconds;

    // Update the timer
    const timer = this.uiManager.getTimer();
    if (timer) {
      timer.setDuration(seconds);
    }
  }

  /**
   * Handle time expiry for the current round
   * Determines winner based on remaining health
   * @returns The player number who won (1 or 2), or 0 for a draw
   */
  public handleTimeExpiry(): 0 | 1 | 2 {
    // Get both players' health bars
    const healthBars = this.uiManager.getHealthBars();
    if (!healthBars) {
      return 0; // Draw if we can't determine health
    }

    const player1Health = healthBars.player1.getHealthPercentage();
    const player2Health = healthBars.player2.getHealthPercentage();

    if (player1Health > player2Health) {
      return 1; // Player 1 wins (more health)
    } else if (player2Health > player1Health) {
      return 2; // Player 2 wins (more health)
    } else {
      return 0; // Draw (equal health)
    }
  }
}
