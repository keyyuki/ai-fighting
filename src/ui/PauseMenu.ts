import { Menu } from "./Menu";
import { Button } from "./Button";

/**
 * Pause Menu screen for the game
 */
export class PauseMenu extends Menu {
  constructor(canvasWidth: number, canvasHeight: number) {
    // Menu is centered and smaller than the full screen
    const menuWidth = 400;
    const menuHeight = 300;
    const x = (canvasWidth - menuWidth) / 2;
    const y = (canvasHeight - menuHeight) / 2;

    super(x, y, menuWidth, menuHeight, "PAUSED");
    this.backgroundColor = "rgba(0, 0, 0, 0.7)";
    this.setupButtons();
  }

  /**
   * Set up the pause menu buttons
   */
  private setupButtons(): void {
    const buttonWidth = 250;
    const buttonHeight = 50;
    const buttonSpacing = 15;
    const totalButtonsHeight = 3 * buttonHeight + 2 * buttonSpacing;

    // Center the buttons vertically within the menu
    let startY = this.y + (this.height - totalButtonsHeight) / 2 + 40; // Extra offset to account for title
    const centerX = this.x + this.width / 2 - buttonWidth / 2;

    // Resume Button (with play icon)
    const resumeButton = new Button(
      centerX,
      startY,
      buttonWidth,
      buttonHeight,
      "Resume",
      () => {
        if (this.onResume) this.onResume();
      },
      "▶" // Play icon
    );

    // Options Button (with gear icon)
    const optionsButton = new Button(
      centerX,
      startY + buttonHeight + buttonSpacing,
      buttonWidth,
      buttonHeight,
      "Options",
      () => {
        if (this.onOptions) this.onOptions();
      },
      "⚙️" // Gear icon
    );

    // Quit to Menu Button (with exit icon)
    const quitButton = new Button(
      centerX,
      startY + 2 * (buttonHeight + buttonSpacing),
      buttonWidth,
      buttonHeight,
      "Quit to Menu",
      () => {
        if (this.onQuit) this.onQuit();
      },
      "🏠" // Home icon
    );

    this.addButton(resumeButton);
    this.addButton(optionsButton);
    this.addButton(quitButton);
  }

  // Event callbacks
  public onResume?: () => void;
  public onOptions?: () => void;
  public onQuit?: () => void;

  /**
   * Render the pause menu with a semi-transparent background
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    // Draw semi-transparent black overlay over the entire canvas
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw menu background
    ctx.fillStyle = "rgba(40, 40, 40, 0.9)";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Draw title
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(this.title, this.x + this.width / 2, this.y + 30);

    // Draw all buttons
    this.buttons.forEach((button) => {
      if (button.isVisible()) {
        button.render(ctx);
      }
    });
  }
}
