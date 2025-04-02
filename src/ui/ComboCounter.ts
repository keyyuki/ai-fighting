import { UIComponent } from "./UIComponent";

/**
 * ComboCounter component to display consecutive hits during gameplay
 */
export class ComboCounter extends UIComponent {
  private comboCount: number = 0;
  private playerNumber: 1 | 2;
  private displayDuration: number = 2000; // ms to display the combo before fading
  private displayTimer: number = 0;
  private animationScale: number = 1.0;
  private isAnimating: boolean = false;
  private fontSize: number = 24;
  private fontFamily: string = "Arial";
  private textColor: string = "#ffffff";
  private shadowColor: string = "#ff0000";
  private animationDuration: number = 300; // ms for the animation
  private animationTimer: number = 0;
  private baseScale: number = 1.0;
  private maxScale: number = 1.5;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    playerNumber: 1 | 2
  ) {
    super(x, y, width, height);
    this.playerNumber = playerNumber;
    this.visible = false; // Only visible when there's an active combo
  }

  /**
   * Increment the combo counter
   * @returns The new combo count
   */
  public incrementCombo(): number {
    this.comboCount++;
    this.displayTimer = this.displayDuration;
    this.visible = true;
    this.isAnimating = true;
    this.animationTimer = this.animationDuration;
    return this.comboCount;
  }

  /**
   * Reset the combo counter to zero
   */
  public resetCombo(): void {
    this.comboCount = 0;
    this.displayTimer = 0;
    this.visible = false;
    this.isAnimating = false;
  }

  /**
   * Get the current combo count
   */
  public getComboCount(): number {
    return this.comboCount;
  }

  /**
   * Update the combo counter state (timer, animations)
   * @param deltaTime Time passed since last update in ms
   */
  public update(deltaTime: number): void {
    if (!this.visible) return;

    // Update display timer
    if (this.displayTimer > 0) {
      this.displayTimer -= deltaTime;
      if (this.displayTimer <= 0) {
        this.resetCombo();
        return;
      }
    }

    // Update animation
    if (this.isAnimating) {
      this.animationTimer -= deltaTime;

      if (this.animationTimer <= 0) {
        this.isAnimating = false;
        this.animationScale = this.baseScale;
      } else {
        // Calculate scale based on animation progress
        const progress = 1 - this.animationTimer / this.animationDuration;
        // Animate from max scale down to base scale (elastic effect)
        this.animationScale =
          this.maxScale -
          (this.maxScale - this.baseScale) * this.easeOutElastic(progress);
      }
    }
  }

  /**
   * Elastic easing function for animations
   * @param t Progress from 0 to 1
   * @returns Eased value
   */
  private easeOutElastic(t: number): number {
    const p = 0.3; // Period
    return (
      Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
    );
  }

  /**
   * Render the combo counter
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.comboCount < 2) return; // Only show for 2+ hits

    const fontSize = this.fontSize * this.animationScale;

    // Position based on player number
    const textAlign = this.playerNumber === 1 ? "left" : "right";
    const textX = this.playerNumber === 1 ? this.x : this.x + this.width;

    ctx.save();

    // Draw combo count
    ctx.font = `bold ${fontSize}px ${this.fontFamily}`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "middle";

    // Draw text shadow
    ctx.fillStyle = this.shadowColor;
    ctx.fillText(
      `${this.comboCount} HITS`,
      textX + 2,
      this.y + this.height / 2 + 2
    );

    // Draw main text
    ctx.fillStyle = this.textColor;
    ctx.fillText(`${this.comboCount} HITS`, textX, this.y + this.height / 2);

    // Draw combo text with highlight color based on count
    if (this.comboCount >= 10) {
      ctx.fillStyle = "#ffcc00"; // Gold for 10+ combo
    } else if (this.comboCount >= 5) {
      ctx.fillStyle = "#ff9900"; // Orange for 5+ combo
    } else {
      ctx.fillStyle = "#ffffff"; // White for smaller combos
    }

    // Use smaller font for "COMBO" text
    const smallerFontSize = fontSize * 0.7;
    ctx.font = `${smallerFontSize}px ${this.fontFamily}`;
    ctx.fillText("COMBO", textX, this.y + this.height / 2 + fontSize * 0.8);

    ctx.restore();
  }

  /**
   * Set custom colors for the combo counter
   * @param textColor Main text color
   * @param shadowColor Text shadow color
   */
  public setColors(textColor: string, shadowColor: string): void {
    this.textColor = textColor;
    this.shadowColor = shadowColor;
  }
}
