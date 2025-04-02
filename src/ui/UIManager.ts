import { UIComponent } from "./UIComponent";
import { MainMenu } from "./MainMenu";
import { CharacterSelectMenu } from "./CharacterSelectMenu";
import { PauseMenu } from "./PauseMenu";
import { UIStateManager } from "./UIStateManager";
import { UIEventHandler } from "./UIEventHandler";
import { GameUIManager } from "./GameUIManager";

// Game states to manage UI screens
export enum GameState {
  MAIN_MENU,
  CHARACTER_SELECT,
  GAMEPLAY,
  PAUSED,
}

/**
 * Manager class to handle all UI components
 * Acts as the main facade for all UI interactions
 */
export class UIManager {
  private components: Map<string, UIComponent>;
  private canvas: HTMLCanvasElement;
  private gameUIManager: GameUIManager;
  private stateManager: UIStateManager;
  private eventHandler: UIEventHandler;
  private mainMenu: MainMenu;
  private characterSelectMenu: CharacterSelectMenu;
  private pauseMenu: PauseMenu;
  private totalRounds: number = 3; // Best of 3 by default

  constructor(canvas: HTMLCanvasElement) {
    this.components = new Map<string, UIComponent>();
    this.canvas = canvas;

    // Initialize menu screens
    this.mainMenu = new MainMenu(canvas.width, canvas.height);
    this.characterSelectMenu = new CharacterSelectMenu(
      canvas.width,
      canvas.height
    );
    this.pauseMenu = new PauseMenu(canvas.width, canvas.height);

    // Add menus to components
    this.addComponent("mainMenu", this.mainMenu);
    this.addComponent("characterSelect", this.characterSelectMenu);
    this.addComponent("pauseMenu", this.pauseMenu);

    // Create the state manager
    this.stateManager = new UIStateManager(this.components);

    // Create the event handler
    this.eventHandler = new UIEventHandler(
      canvas,
      this.mainMenu,
      this.characterSelectMenu,
      this.pauseMenu,
      this.stateManager
    );

    // Create the game UI manager
    this.gameUIManager = new GameUIManager(
      this.components,
      canvas.width,
      canvas.height,
      this.totalRounds
    );

    // Set up game UI components (health bars, timer, etc.)
    this.gameUIManager.setupGameUI();

    // Set initial visibility
    this.stateManager.switchToState(GameState.MAIN_MENU);
  }

  /**
   * Add a UI component with a unique ID
   * @param id Unique identifier for the component
   * @param component The UI component to add
   */
  public addComponent(id: string, component: UIComponent): void {
    this.components.set(id, component);
  }

  /**
   * Get a component by its ID
   * @param id The ID of the component to retrieve
   */
  public getComponent(id: string): UIComponent | undefined {
    return this.components.get(id);
  }

  /**
   * Remove a component by its ID
   * @param id The ID of the component to remove
   */
  public removeComponent(id: string): boolean {
    return this.components.delete(id);
  }

  /**
   * Update all visible UI components
   * @param deltaTime Time passed since last update in ms
   */
  public update(deltaTime: number): void {
    // Only update components relevant to the current game state
    switch (this.stateManager.getGameState()) {
      case GameState.MAIN_MENU:
        this.mainMenu.update(deltaTime);
        break;

      case GameState.CHARACTER_SELECT:
        this.characterSelectMenu.update(deltaTime);
        break;

      case GameState.GAMEPLAY:
        // Update gameplay UI components
        [
          "player1HealthBar",
          "player2HealthBar",
          "timer",
          "roundIndicator",
          "player1ComboCounter",
          "player2ComboCounter",
        ].forEach((id) => {
          const component = this.components.get(id);
          if (component && component.isVisible()) {
            component.update(deltaTime);
          }
        });
        break;

      case GameState.PAUSED:
        this.pauseMenu.update(deltaTime);
        break;
    }
  }

  /**
   * Render all visible UI components
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Render components based on the current game state
    switch (this.stateManager.getGameState()) {
      case GameState.MAIN_MENU:
        this.mainMenu.render(ctx);
        break;

      case GameState.CHARACTER_SELECT:
        this.characterSelectMenu.render(ctx);
        break;

      case GameState.GAMEPLAY:
        // Render gameplay UI components
        [
          "player1HealthBar",
          "player2HealthBar",
          "timer",
          "roundIndicator",
          "player1ComboCounter",
          "player2ComboCounter",
        ].forEach((id) => {
          const component = this.components.get(id);
          if (component && component.isVisible()) {
            component.render(ctx);
          }
        });
        break;

      case GameState.PAUSED:
        // First render the gameplay UI
        [
          "player1HealthBar",
          "player2HealthBar",
          "timer",
          "roundIndicator",
        ].forEach((id) => {
          const component = this.components.get(id);
          if (component) {
            component.render(ctx);
          }
        });

        // Then render the pause menu on top
        this.pauseMenu.render(ctx);
        break;
    }
  }

  /**
   * Get the current game state
   */
  public getGameState(): GameState {
    return this.stateManager.getGameState();
  }

  /**
   * Change the current game state
   * @param state New game state
   */
  public switchToState(state: GameState): void {
    this.stateManager.switchToState(state);
  }

  /**
   * Get the player health bars
   */
  public getHealthBars() {
    return this.gameUIManager.getHealthBars();
  }

  /**
   * Get the timer
   */
  public getTimer() {
    return this.gameUIManager.getTimer();
  }

  /**
   * Get the round indicator
   */
  public getRoundIndicator() {
    return this.gameUIManager.getRoundIndicator();
  }

  /**
   * Get the combo counters
   */
  public getComboCounters() {
    return this.gameUIManager.getComboCounters();
  }

  /**
   * Add hit to combo counter for given player
   * @param playerNumber Player 1 or 2
   * @returns New combo count
   */
  public incrementCombo(playerNumber: 1 | 2): number {
    return this.gameUIManager.incrementCombo(playerNumber);
  }

  /**
   * Reset combo counter for given player
   * @param playerNumber Player 1 or 2
   */
  public resetCombo(playerNumber: 1 | 2): void {
    this.gameUIManager.resetCombo(playerNumber);
  }

  /**
   * Add round win for given player
   * @param playerNumber Player 1 or 2
   * @returns New win count
   */
  public addRoundWin(playerNumber: 1 | 2): number {
    return this.gameUIManager.addRoundWin(playerNumber);
  }

  /**
   * Start a new round
   * @param roundNumber Round number to start
   */
  public startRound(roundNumber: number): void {
    this.gameUIManager.startRound(roundNumber);
  }

  /**
   * Check if player has won the match
   * @param playerNumber Player 1 or 2
   * @returns True if player has won enough rounds
   */
  public isMatchWinner(playerNumber: 1 | 2): boolean {
    return this.gameUIManager.isMatchWinner(playerNumber);
  }

  /**
   * Get selected characters from character select screen
   */
  public getSelectedCharacters(): { p1: string; p2: string } | null {
    return this.stateManager.getSelectedCharacters();
  }

  /**
   * Trigger the pause menu
   */
  public pauseGame(): void {
    this.stateManager.pauseGame();
  }

  /**
   * Resume the game from pause
   */
  public resumeGame(): void {
    this.stateManager.resumeGame();
  }

  /**
   * Clean up resources used by UI manager
   */
  public destroy(): void {
    this.eventHandler.destroy();
  }

  /**
   * Handle window resize
   */
  public handleResize(width: number, height: number): void {
    // Update canvas dimensions
    this.canvas.width = width;
    this.canvas.height = height;

    // Update GameUIManager
    this.gameUIManager.handleResize(width, height);

    // Create new menu instances with updated dimensions
    this.mainMenu = new MainMenu(width, height);
    this.characterSelectMenu = new CharacterSelectMenu(width, height);
    this.pauseMenu = new PauseMenu(width, height);

    // Update component references
    this.addComponent("mainMenu", this.mainMenu);
    this.addComponent("characterSelect", this.characterSelectMenu);
    this.addComponent("pauseMenu", this.pauseMenu);

    // Recreate event handler with new menu references
    this.eventHandler.destroy(); // Clean up old event listeners
    this.eventHandler = new UIEventHandler(
      this.canvas,
      this.mainMenu,
      this.characterSelectMenu,
      this.pauseMenu,
      this.stateManager
    );

    // Set visibility based on current state
    this.stateManager.switchToState(this.getGameState());
  }

  /**
   * Set the total number of rounds for the match
   * @param totalRounds Number of rounds
   */
  public setTotalRounds(totalRounds: number): void {
    this.totalRounds = totalRounds;
    this.gameUIManager.setTotalRounds(totalRounds);
  }
}
