import { UIComponent } from "./UIComponent";

/**
 * RoundIndicator component to display round information and wins
 */
export class RoundIndicator extends UIComponent {
  private totalRounds: number = 3; // Best of 3 by default
  private currentRound: number = 1;
  private player1Wins: number = 0;
  private player2Wins: number = 0;
  private showRoundText: boolean = false;
  private roundTextTimer: number = 0;
  private roundTextDuration: number = 2000; // ms to display "ROUND X" text
  private fontSize: number = 20;
  private fontFamily: string = "Arial";
  private iconSize: number = 15;
  private iconSpacing: number = 5;
  private roundAnnounceFont: string = "bold 48px Arial";
  private textColor: string = "#ffffff";
  private activeIconColor: string = "#ffcc00"; // Gold for won rounds
  private inactiveIconColor: string = "#666666"; // Gray for future rounds
  private player1Color: string = "#4488ff"; // Blue for P1
  private player2Color: string = "#ff4444"; // Red for P2

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    totalRounds: number = 3
  ) {
    super(x, y, width, height);
    this.totalRounds = totalRounds;
  }

  /**
   * Start a new round
   * @param roundNumber The round number (1-indexed)
   */
  public startRound(roundNumber: number): void {
    this.currentRound = roundNumber;
    this.showRoundText = true;
    this.roundTextTimer = this.roundTextDuration;
  }

  /**
   * Set the number of rounds won by a player
   * @param playerNumber Player 1 or 2
   * @param wins Number of round wins
   */
  public setPlayerWins(playerNumber: 1 | 2, wins: number): void {
    if (playerNumber === 1) {
      this.player1Wins = Math.min(wins, this.totalRounds);
    } else {
      this.player2Wins = Math.min(wins, this.totalRounds);
    }
  }

  /**
   * Add a round win for a player
   * @param playerNumber Player 1 or 2
   * @returns The new win count for the player
   */
  public addPlayerWin(playerNumber: 1 | 2): number {
    if (playerNumber === 1) {
      this.player1Wins = Math.min(this.player1Wins + 1, this.totalRounds);
      return this.player1Wins;
    } else {
      this.player2Wins = Math.min(this.player2Wins + 1, this.totalRounds);
      return this.player2Wins;
    }
  }

  /**
   * Reset the round indicator to initial state
   */
  public reset(): void {
    this.currentRound = 1;
    this.player1Wins = 0;
    this.player2Wins = 0;
    this.showRoundText = false;
    this.roundTextTimer = 0;
  }

  /**
   * Check if a player has won the match
   * @param playerNumber Player 1 or 2
   * @returns True if the player has won enough rounds
   */
  public isMatchWinner(playerNumber: 1 | 2): boolean {
    const winThreshold = Math.ceil(this.totalRounds / 2); // Majority of rounds
    if (playerNumber === 1) {
      return this.player1Wins >= winThreshold;
    } else {
      return this.player2Wins >= winThreshold;
    }
  }

  /**
   * Update the round indicator
   * @param deltaTime Time passed since last update in ms
   */
  public update(deltaTime: number): void {
    if (this.showRoundText && this.roundTextTimer > 0) {
      this.roundTextTimer -= deltaTime;
      if (this.roundTextTimer <= 0) {
        this.showRoundText = false;
      }
    }
  }

  /**
   * Render the round indicator
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    // Draw round wins (circles/stars/etc.) at the top center
    this.drawRoundWins(ctx);

    // Draw the "ROUND X" text if active
    if (this.showRoundText) {
      this.drawRoundAnnouncement(ctx);
    }
  }

  /**
   * Draw the round wins indicators
   * @param ctx Canvas rendering context
   */
  private drawRoundWins(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Calculate total width of all icons
    const totalWidth = this.totalRounds * (this.iconSize + this.iconSpacing);

    // Center position
    const centerX = this.x + this.width / 2;
    const startX = centerX - totalWidth / 2;
    const y = this.y + 5; // Small offset from top

    // Draw round win indicators for each player
    for (let i = 0; i < this.totalRounds; i++) {
      const iconX = startX + i * (this.iconSize + this.iconSpacing);

      // Draw P1 wins (above)
      ctx.fillStyle =
        i < this.player1Wins ? this.player1Color : this.inactiveIconColor;
      ctx.beginPath();
      ctx.arc(iconX, y - 10, this.iconSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw P2 wins (below)
      ctx.fillStyle =
        i < this.player2Wins ? this.player2Color : this.inactiveIconColor;
      ctx.beginPath();
      ctx.arc(iconX, y + 10, this.iconSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw current round text
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = this.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `ROUND ${this.currentRound}/${this.totalRounds}`,
      centerX,
      y + 35
    );

    ctx.restore();
  }

  /**
   * Draw the large "ROUND X" announcement
   * @param ctx Canvas rendering context
   */
  private drawRoundAnnouncement(ctx: CanvasRenderingContext2D): void {
    if (!this.showRoundText) return;

    ctx.save();

    // Calculate center of the canvas
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2 - 50; // Slightly above center

    // Calculate alpha based on time remaining (fade out effect)
    const alpha = this.roundTextTimer / this.roundTextDuration;
    ctx.globalAlpha = alpha;

    // Draw shadow
    ctx.fillStyle = "#000000";
    ctx.font = this.roundAnnounceFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`ROUND ${this.currentRound}`, centerX + 3, centerY + 3);

    // Draw text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`ROUND ${this.currentRound}`, centerX, centerY);

    // Draw "FIGHT!" text if less than half time remaining
    if (this.roundTextTimer < this.roundTextDuration / 2) {
      const fightAlpha = 1 - this.roundTextTimer / (this.roundTextDuration / 2);
      ctx.globalAlpha = fightAlpha;

      // Draw shadow
      ctx.fillStyle = "#ff0000";
      ctx.font = "bold 72px Arial";
      ctx.fillText("FIGHT!", centerX + 4, centerY + 80 + 4);

      // Draw text
      ctx.fillStyle = "#ffcc00";
      ctx.fillText("FIGHT!", centerX, centerY + 80);
    }

    ctx.restore();
  }

  /**
   * Set custom colors for the round indicator
   */
  public setColors(
    textColor: string,
    player1Color: string,
    player2Color: string,
    activeIconColor: string,
    inactiveIconColor: string
  ): void {
    this.textColor = textColor;
    this.player1Color = player1Color;
    this.player2Color = player2Color;
    this.activeIconColor = activeIconColor;
    this.inactiveIconColor = inactiveIconColor;
  }

  /**
   * Get the current round number
   */
  public getCurrentRound(): number {
    return this.currentRound;
  }

  /**
   * Get the total number of rounds
   */
  public getTotalRounds(): number {
    return this.totalRounds;
  }

  /**
   * Get the number of wins for a player
   * @param playerNumber Player 1 or 2
   */
  public getPlayerWins(playerNumber: 1 | 2): number {
    return playerNumber === 1 ? this.player1Wins : this.player2Wins;
  }
}
