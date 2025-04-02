import { UIComponent } from "./UIComponent";

/**
 * HealthBar component for displaying player health in the UI
 */
export class HealthBar extends UIComponent {
  private maxHealth: number;
  private currentHealth: number;
  private playerNumber: 1 | 2; // 1 = left side, 2 = right side
  private displayedHealth: number; // For smooth animations
  private damageAnimationDuration: number = 500; // ms
  private damageAnimationTimer: number = 0;
  private borderWidth: number = 2;
  private borderColor: string = "#ffffff";
  private healthColor: string = "#00cc00"; // Green
  private damageColor: string = "#ff0000"; // Red
  private backgroundColor: string = "#222222"; // Dark gray
  private textColor: string = "#ffffff"; // White
  private fontSize: number = 16;
  private fontFamily: string = "Arial";

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    maxHealth: number,
    playerNumber: 1 | 2
  ) {
    super(x, y, width, height);
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.displayedHealth = maxHealth;
    this.playerNumber = playerNumber;
  }

  /**
   * Set the current health value
   * @param health New health value (will be clamped between 0 and maxHealth)
   */
  public setHealth(health: number): void {
    // Store previous health for animation
    const previousHealth = this.currentHealth;

    // Clamp health value
    this.currentHealth = Math.max(0, Math.min(health, this.maxHealth));

    // Only animate if health decreased
    if (this.currentHealth < previousHealth) {
      this.damageAnimationTimer = this.damageAnimationDuration;
    } else {
      // If health increased, update displayed health immediately
      this.displayedHealth = this.currentHealth;
    }
  }

  /**
   * Get the current health value
   */
  public getHealth(): number {
    return this.currentHealth;
  }

  /**
   * Get the maximum health value
   */
  public getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Get the health as a percentage (0-100)
   */
  public getHealthPercentage(): number {
    return (this.currentHealth / this.maxHealth) * 100;
  }

  /**
   * Update the health bar state (animations, etc)
   * @param deltaTime Time passed since last update in ms
   */
  public update(deltaTime: number): void {
    if (!this.visible) return;

    // Update damage animation
    if (this.damageAnimationTimer > 0) {
      this.damageAnimationTimer -= deltaTime;

      // Calculate animated health value
      const animationProgress =
        1 - this.damageAnimationTimer / this.damageAnimationDuration;
      this.displayedHealth =
        this.displayedHealth +
        (this.currentHealth - this.displayedHealth) *
          this.easeOutCubic(animationProgress);

      if (this.damageAnimationTimer <= 0) {
        this.displayedHealth = this.currentHealth;
      }
    }
  }

  /**
   * Cubic easing function for smooth animations
   * @param t Progress from 0 to 1
   * @returns Eased value
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Render the health bar
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const healthPercentage = this.currentHealth / this.maxHealth;
    const displayedHealthPercentage = this.displayedHealth / this.maxHealth;

    ctx.save();

    // Draw background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Determine health bar direction based on player number
    const isLeftToRight = this.playerNumber === 1;
    const barX = isLeftToRight
      ? this.x
      : this.x + this.width * (1 - displayedHealthPercentage);
    const barWidth = this.width * displayedHealthPercentage;

    // Draw damage bar (red portion showing recent damage)
    if (
      this.damageAnimationTimer > 0 &&
      displayedHealthPercentage > healthPercentage
    ) {
      const damageBarWidth =
        this.width * (displayedHealthPercentage - healthPercentage);
      const damageBarX = isLeftToRight
        ? this.x + barWidth - damageBarWidth
        : this.x + this.width * (1 - displayedHealthPercentage);

      ctx.fillStyle = this.damageColor;
      ctx.fillRect(damageBarX, this.y, damageBarWidth, this.height);
    }

    // Draw current health
    ctx.fillStyle = this.healthColor;
    ctx.fillRect(barX, this.y, barWidth, this.height);

    // Draw border
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Draw health text
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = this.textColor;
    ctx.textAlign = isLeftToRight ? "left" : "right";
    ctx.textBaseline = "middle";

    const textX = isLeftToRight ? this.x + 10 : this.x + this.width - 10;
    const textY = this.y + this.height / 2;

    // Format as "Current / Max" or just percentage
    const healthText = `${Math.ceil(this.currentHealth)}/${this.maxHealth}`;
    ctx.fillText(healthText, textX, textY);

    ctx.restore();
  }

  /**
   * Set custom colors for the health bar
   * @param healthColor Color for the health portion
   * @param damageColor Color for the damage animation
   * @param backgroundColor Background color
   * @param borderColor Border color
   * @param textColor Text color
   */
  public setColors(
    healthColor: string,
    damageColor: string,
    backgroundColor: string,
    borderColor: string,
    textColor: string
  ): void {
    this.healthColor = healthColor;
    this.damageColor = damageColor;
    this.backgroundColor = backgroundColor;
    this.borderColor = borderColor;
    this.textColor = textColor;
  }
}
