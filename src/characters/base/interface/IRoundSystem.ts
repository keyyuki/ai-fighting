/**
 * Interface for handling round state and progression in a fighting game
 */
export interface IRoundSystem {
  /**
   * Start a new round
   * @param roundNumber Round number to start
   */
  startRound(roundNumber: number): void;

  /**
   * End the current round and determine winner
   * @param winnerPlayerNumber The player number who won (1 or 2)
   * @returns True if the match has ended, false if more rounds remain
   */
  endRound(winnerPlayerNumber: 1 | 2): boolean;

  /**
   * Reset the round system to its initial state
   */
  reset(): void;

  /**
   * Get the current round number
   */
  getCurrentRound(): number;

  /**
   * Get the total number of rounds in the match
   */
  getTotalRounds(): number;

  /**
   * Set the total number of rounds for the match
   * @param rounds The new total number of rounds
   */
  setTotalRounds(rounds: number): void;

  /**
   * Get the number of rounds won by a player
   * @param playerNumber The player number (1 or 2)
   */
  getPlayerRoundWins(playerNumber: 1 | 2): number;

  /**
   * Check if a player has won the match
   * @param playerNumber The player number to check (1 or 2)
   */
  isMatchWinner(playerNumber: 1 | 2): boolean;

  /**
   * Get the time remaining in the current round
   */
  getRoundTimeRemaining(): number;

  /**
   * Set the duration for each round in seconds
   * @param seconds Round duration in seconds
   */
  setRoundDuration(seconds: number): void;

  /**
   * Handle time expiry for the current round
   * Determines winner based on remaining health
   * @returns The player number who won (1 or 2), or 0 for a draw
   */
  handleTimeExpiry(): 0 | 1 | 2;
}
