import { GameState } from "./UIManager";
import { MainMenu } from "./MainMenu";
import { CharacterSelectMenu } from "./CharacterSelectMenu";
import { PauseMenu } from "./PauseMenu";
import { UIStateManager } from "./UIStateManager";

/**
 * Handles user inputs for UI interactions
 */
export class UIEventHandler {
  private canvas: HTMLCanvasElement;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mainMenu: MainMenu;
  private characterSelectMenu: CharacterSelectMenu;
  private pauseMenu: PauseMenu;
  private stateManager: UIStateManager;

  constructor(
    canvas: HTMLCanvasElement,
    mainMenu: MainMenu,
    characterSelectMenu: CharacterSelectMenu,
    pauseMenu: PauseMenu,
    stateManager: UIStateManager
  ) {
    this.canvas = canvas;
    this.mainMenu = mainMenu;
    this.characterSelectMenu = characterSelectMenu;
    this.pauseMenu = pauseMenu;
    this.stateManager = stateManager;

    this.setupEventHandlers();
  }

  /**
   * Set up input event handlers for menus
   */
  private setupEventHandlers(): void {
    // Main Menu callbacks
    this.mainMenu.onStartGame = () => {
      this.stateManager.switchToState(GameState.GAMEPLAY);
    };

    this.mainMenu.onCharacterSelect = () => {
      this.stateManager.switchToState(GameState.CHARACTER_SELECT);
    };

    this.mainMenu.onQuit = () => {
      // This would be implemented by the game to handle quitting
      console.log("Quit game requested");
    };

    // Character Select callbacks
    this.characterSelectMenu.onBack = () => {
      this.stateManager.switchToState(GameState.MAIN_MENU);
    };

    this.characterSelectMenu.onStartFight = (p1: string, p2: string) => {
      this.stateManager.setSelectedCharacters(p1, p2);
      this.stateManager.switchToState(GameState.GAMEPLAY);
    };

    // Pause Menu callbacks
    this.pauseMenu.onResume = () => {
      this.stateManager.switchToState(GameState.GAMEPLAY);
    };

    this.pauseMenu.onQuit = () => {
      this.stateManager.switchToState(GameState.MAIN_MENU);
    };

    // Canvas event listeners for mouse input
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);

    // Add keyboard listener for ESC key to pause/unpause
    window.addEventListener("keydown", this.handleKeyDown);
  }

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  /**
   * Handle mouse move events
   */
  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;

    // Update hover states based on current game state
    switch (this.stateManager.getGameState()) {
      case GameState.MAIN_MENU:
        this.mainMenu.handleMouseMove(this.mouseX, this.mouseY);
        break;
      case GameState.CHARACTER_SELECT:
        this.characterSelectMenu.handleMouseMove(this.mouseX, this.mouseY);
        break;
      case GameState.PAUSED:
        this.pauseMenu.handleMouseMove(this.mouseX, this.mouseY);
        break;
    }
  };

  /**
   * Handle mouse down events
   */
  private handleMouseDown = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Handle clicks based on current game state
    switch (this.stateManager.getGameState()) {
      case GameState.MAIN_MENU:
        this.mainMenu.handleMouseDown(mouseX, mouseY);
        break;
      case GameState.CHARACTER_SELECT:
        this.characterSelectMenu.handleMouseDown(mouseX, mouseY);
        break;
      case GameState.PAUSED:
        this.pauseMenu.handleMouseDown(mouseX, mouseY);
        break;
    }
  };

  /**
   * Handle mouse up events
   */
  private handleMouseUp = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Handle clicks based on current game state
    switch (this.stateManager.getGameState()) {
      case GameState.MAIN_MENU:
        this.mainMenu.handleMouseUp(mouseX, mouseY);
        break;
      case GameState.CHARACTER_SELECT:
        this.characterSelectMenu.handleMouseUp(mouseX, mouseY);
        break;
      case GameState.PAUSED:
        this.pauseMenu.handleMouseUp(mouseX, mouseY);
        break;
    }
  };

  /**
   * Handle keyboard events
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      const currentState = this.stateManager.getGameState();
      if (currentState === GameState.GAMEPLAY) {
        this.stateManager.switchToState(GameState.PAUSED);
      } else if (currentState === GameState.PAUSED) {
        this.stateManager.switchToState(GameState.GAMEPLAY);
      }
    }
  };
}
