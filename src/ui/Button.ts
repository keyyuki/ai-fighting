import { UIComponent } from "./UIComponent";

/**
 * Button component for interactive UI elements
 */
export class Button extends UIComponent {
  private text: string;
  private fontSize: number = 24;
  private fontFamily: string = "Arial";
  private backgroundColor: string = "#333333";
  private hoverColor: string = "#555555";
  private textColor: string = "#ffffff";
  private borderColor: string = "#ffffff";
  private borderWidth: number = 2;
  private borderRadius: number = 5;
  private isHovered: boolean = false;
  private isPressed: boolean = false;
  private onClick: () => void;
  private icon?: string; // Font icon (e.g., "▶" for play)

  // Polyfill for roundRect if not available
  private static polyfillRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    // If native roundRect is available, use it
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, radius);
      return;
    }

    // Otherwise use our own implementation
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void,
    icon?: string
  ) {
    super(x, y, width, height);
    this.text = text;
    this.onClick = onClick;
    this.icon = icon;
  }

  /**
   * Handle mouse move event to check for hover state
   * @param mouseX Mouse X position
   * @param mouseY Mouse Y position
   * @returns True if the mouse is hovering over the button
   */
  public handleMouseMove(mouseX: number, mouseY: number): boolean {
    const wasHovered = this.isHovered;

    // Check if mouse is inside button
    this.isHovered =
      mouseX >= this.x &&
      mouseX <= this.x + this.width &&
      mouseY >= this.y &&
      mouseY <= this.y + this.height;

    // Return true if hover state changed
    return wasHovered !== this.isHovered;
  }

  /**
   * Handle mouse down event
   * @param mouseX Mouse X position
   * @param mouseY Mouse Y position
   * @returns True if the button was clicked
   */
  public handleMouseDown(mouseX: number, mouseY: number): boolean {
    if (
      mouseX >= this.x &&
      mouseX <= this.x + this.width &&
      mouseY >= this.y &&
      mouseY <= this.y + this.height
    ) {
      this.isPressed = true;
      return true;
    }
    return false;
  }

  /**
   * Handle mouse up event
   * @param mouseX Mouse X position
   * @param mouseY Mouse Y position
   * @returns True if the click was completed (down and up on the button)
   */
  public handleMouseUp(mouseX: number, mouseY: number): boolean {
    const wasPressed = this.isPressed;
    this.isPressed = false;

    if (
      wasPressed &&
      mouseX >= this.x &&
      mouseX <= this.x + this.width &&
      mouseY >= this.y &&
      mouseY <= this.y + this.height
    ) {
      // Button was clicked, execute callback
      this.onClick();
      return true;
    }

    return false;
  }

  /**
   * Render the button
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    // Determine button color based on state
    const bgColor = this.isPressed
      ? this.hoverColor
      : this.isHovered
      ? this.hoverColor
      : this.backgroundColor;

    // Draw button background with rounded corners
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    Button.polyfillRoundRect(
      ctx,
      this.x,
      this.y,
      this.width,
      this.height,
      this.borderRadius
    );
    ctx.fill();

    // Draw button border
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.beginPath();
    Button.polyfillRoundRect(
      ctx,
      this.x,
      this.y,
      this.width,
      this.height,
      this.borderRadius
    );
    ctx.stroke();

    // Draw button text
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = this.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textX = this.x + this.width / 2;
    const textY = this.y + this.height / 2;

    // If there's an icon, draw it before the text
    if (this.icon) {
      const combinedText = `${this.icon} ${this.text}`;
      ctx.fillText(combinedText, textX, textY);
    } else {
      ctx.fillText(this.text, textX, textY);
    }
  }

  /**
   * Set the button's text
   * @param text New button text
   */
  public setText(text: string): void {
    this.text = text;
  }

  /**
   * Set the button's icon
   * @param icon Icon character (e.g., "▶")
   */
  public setIcon(icon: string): void {
    this.icon = icon;
  }

  /**
   * Set the button's colors
   */
  public setColors(
    backgroundColor: string,
    hoverColor: string,
    textColor: string,
    borderColor: string
  ): void {
    this.backgroundColor = backgroundColor;
    this.hoverColor = hoverColor;
    this.textColor = textColor;
    this.borderColor = borderColor;
  }
}
