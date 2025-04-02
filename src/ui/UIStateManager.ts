import { GameState } from "./UIManager";
import { UIComponent } from "./UIComponent";
import { Timer } from "./Timer";
import { RoundIndicator } from "./RoundIndicator";
import { MainMenu } from "./MainMenu";
import { CharacterSelectMenu } from "./CharacterSelectMenu";
import { PauseMenu } from "./PauseMenu";
import { ComboCounter } from "./ComboCounter";
import { HealthBar } from "./HealthBar";

/**
 * Manages UI state transitions and component visibility
 */
export class UIStateManager {
  private gameState: GameState = GameState.MAIN_MENU;
  private components: Map<string, UIComponent>;
  private selectedCharacters: { p1: string; p2: string } | null = null;

  constructor(components: Map<string, UIComponent>) {
    this.components = components;
  }

  /**
   * Change the current game state and update UI visibility
   */
  public switchToState(newState: GameState): void {
    this.gameState = newState;

    // Hide all components first
    this.components.forEach((component) => {
      component.setVisible(false);
    });

    // Show components based on the new state
    switch (this.gameState) {
      case GameState.MAIN_MENU:
        const mainMenu = this.components.get("mainMenu");
        if (mainMenu) mainMenu.setVisible(true);
        break;

      case GameState.CHARACTER_SELECT:
        const charSelect = this.components.get("characterSelect");
        if (charSelect) charSelect.setVisible(true);
        break;

      case GameState.GAMEPLAY:
        // Show gameplay UI
        const gameplayUI = [
          "player1HealthBar",
          "player2HealthBar",
          "timer",
          "roundIndicator",
        ];
        gameplayUI.forEach((id) => {
          const component = this.components.get(id);
          if (component) {
            component.setVisible(true);
          }
        });

        // Start the timer
        const timer = this.getTimer();
        if (timer) {
          timer.reset();
          timer.start();
        }

        // Start the first round if round indicator exists
        const roundIndicator = this.getRoundIndicator();
        if (roundIndicator) {
          roundIndicator.startRound(1);
        }

        break;

      case GameState.PAUSED:
        // Show both gameplay UI and pause menu
        const pauseUI = [
          "player1HealthBar",
          "player2HealthBar",
          "timer",
          "roundIndicator",
          "pauseMenu",
        ];
        pauseUI.forEach((id) => {
          const component = this.components.get(id);
          if (component) {
            component.setVisible(true);
          }
        });

        // Pause the timer
        const pausedTimer = this.getTimer();
        if (pausedTimer) {
          pausedTimer.pause();
        }
        break;
    }
  }

  /**
   * Get the current game state
   */
  public getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Set selected characters from character select screen
   */
  public setSelectedCharacters(p1: string, p2: string): void {
    this.selectedCharacters = { p1, p2 };
  }

  /**
   * Get selected characters from character select screen
   */
  public getSelectedCharacters(): { p1: string; p2: string } | null {
    return this.selectedCharacters;
  }

  /**
   * Trigger the pause menu
   */
  public pauseGame(): void {
    if (this.gameState === GameState.GAMEPLAY) {
      this.switchToState(GameState.PAUSED);
    }
  }

  /**
   * Resume the game from pause
   */
  public resumeGame(): void {
    if (this.gameState === GameState.PAUSED) {
      this.switchToState(GameState.GAMEPLAY);
    }
  }

  /**
   * Helper method to get the timer component
   */
  private getTimer(): Timer | null {
    const timer = this.components.get("timer");
    if (timer instanceof Timer) {
      return timer;
    }
    return null;
  }

  /**
   * Helper method to get the round indicator component
   */
  private getRoundIndicator(): RoundIndicator | null {
    const roundIndicator = this.components.get("roundIndicator");
    if (roundIndicator instanceof RoundIndicator) {
      return roundIndicator;
    }
    return null;
  }
}
