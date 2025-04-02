import { UIComponent } from "./UIComponent";
import { Button } from "./Button";

/**
 * Base Menu class for menu screens
 */
export class Menu extends UIComponent {
  protected buttons: Button[] = [];
  protected title: string;
  protected backgroundColor: string = "rgba(0, 0, 0, 0.8)";
  protected titleColor: string = "#ffffff";
  protected titleFont: string = "bold 48px Arial";

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string
  ) {
    super(x, y, width, height);
    this.title = title;
  }

  /**
   * Add a button to the menu
   * @param button Button component to add
   */
  public addButton(button: Button): void {
    this.buttons.push(button);
  }

  /**
   * Handle mouse move event for all buttons
   * @param mouseX Mouse X position
   * @param mouseY Mouse Y position
   */
  public handleMouseMove(mouseX: number, mouseY: number): void {
    if (!this.visible) return;

    this.buttons.forEach((button) => {
      if (button.isVisible()) {
        button.handleMouseMove(mouseX, mouseY);
      }
    });
  }

  /**
   * Handle mouse down event for all buttons
   * @param mouseX Mouse X position
   * @param mouseY Mouse Y position
   */
  public handleMouseDown(mouseX: number, mouseY: number): void {
    if (!this.visible) return;

    this.buttons.forEach((button) => {
      if (button.isVisible()) {
        button.handleMouseDown(mouseX, mouseY);
      }
    });
  }

  /**
   * Handle mouse up event for all buttons
   * @param mouseX Mouse X position
   * @param mouseY Mouse Y position
   */
  public handleMouseUp(mouseX: number, mouseY: number): void {
    if (!this.visible) return;

    this.buttons.forEach((button) => {
      if (button.isVisible()) {
        button.handleMouseUp(mouseX, mouseY);
      }
    });
  }

  /**
   * Update the menu and its components
   * @param deltaTime Time passed since last update
   */
  public update(deltaTime: number): void {
    if (!this.visible) return;

    this.buttons.forEach((button) => {
      if (button.isVisible()) {
        button.update(deltaTime);
      }
    });
  }

  /**
   * Render the menu and its components
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    // Draw background overlay
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw title
    ctx.font = this.titleFont;
    ctx.fillStyle = this.titleColor;
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
