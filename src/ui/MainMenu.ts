import { Menu } from "./Menu";
import { Button } from "./Button";

/**
 * Main Menu screen for the game
 */
export class MainMenu extends Menu {
  constructor(canvasWidth: number, canvasHeight: number) {
    // Menu covers the entire canvas
    super(0, 0, canvasWidth, canvasHeight, "FIGHTING GAME");
    this.setupButtons();
  }

  /**
   * Set up the main menu buttons
   */
  private setupButtons(): void {
    const buttonWidth = 300;
    const buttonHeight = 60;
    const buttonSpacing = 20;
    const totalButtonsHeight = 4 * buttonHeight + 3 * buttonSpacing;

    // Center the buttons vertically, starting a bit below the center
    let startY = this.y + (this.height - totalButtonsHeight) / 2 + 30;
    const centerX = this.x + this.width / 2 - buttonWidth / 2;

    // Start Game Button (with play icon)
    const startGameButton = new Button(
      centerX,
      startY,
      buttonWidth,
      buttonHeight,
      "Start Game",
      () => {
        // This will be connected to the game start handler in the UIManager
        if (this.onStartGame) this.onStartGame();
      },
      "▶" // Play icon
    );

    // Character Select Button (with user icon)
    const characterSelectButton = new Button(
      centerX,
      startY + buttonHeight + buttonSpacing,
      buttonWidth,
      buttonHeight,
      "Character Select",
      () => {
        // This will be connected to show character select screen
        if (this.onCharacterSelect) this.onCharacterSelect();
      },
      "👤" // User/character icon
    );

    // Options Button (with gear icon)
    const optionsButton = new Button(
      centerX,
      startY + 2 * (buttonHeight + buttonSpacing),
      buttonWidth,
      buttonHeight,
      "Options",
      () => {
        // This will be connected to show options screen
        if (this.onOptions) this.onOptions();
      },
      "⚙️" // Gear icon
    );

    // Quit Button (with exit icon)
    const quitButton = new Button(
      centerX,
      startY + 3 * (buttonHeight + buttonSpacing),
      buttonWidth,
      buttonHeight,
      "Quit Game",
      () => {
        // This will be connected to quit the game
        if (this.onQuit) this.onQuit();
      },
      "✕" // X icon
    );

    this.addButton(startGameButton);
    this.addButton(characterSelectButton);
    this.addButton(optionsButton);
    this.addButton(quitButton);
  }

  // Event callbacks
  public onStartGame?: () => void;
  public onCharacterSelect?: () => void;
  public onOptions?: () => void;
  public onQuit?: () => void;

  /**
   * Render the main menu with additional elements
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    // Draw a semi-transparent overlay for the whole screen
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw title with shadow effect
    ctx.save();
    ctx.font = "bold 72px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Draw text shadow
    ctx.fillStyle = "#aa0000";
    ctx.fillText(this.title, this.x + this.width / 2 + 3, this.y + 80 + 3);

    // Draw main text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(this.title, this.x + this.width / 2, this.y + 80);
    ctx.restore();

    // Draw subtitle
    ctx.font = "24px Arial";
    ctx.fillStyle = "#cccccc";
    ctx.textAlign = "center";
    ctx.fillText(
      "Press a button to continue",
      this.x + this.width / 2,
      this.y + 160
    );

    // Draw version text at the bottom right
    ctx.font = "16px Arial";
    ctx.fillStyle = "#888888";
    ctx.textAlign = "right";
    ctx.fillText("v0.1.0", this.x + this.width - 20, this.y + this.height - 20);

    // Draw all buttons
    this.buttons.forEach((button) => {
      if (button.isVisible()) {
        button.render(ctx);
      }
    });
  }
}
