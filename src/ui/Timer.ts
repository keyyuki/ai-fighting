import { UIComponent } from "./UIComponent";

/**
 * Timer component for displaying and managing round time
 */
export class Timer extends UIComponent {
  private maxTime: number; // Time in seconds
  private currentTime: number;
  private isRunning: boolean = false;
  private fontSize: number = 36;
  private fontFamily: string = "Arial";
  private textColor: string = "#ffffff";
  private warningColor: string = "#ff0000";
  private warningThreshold: number = 10; // Turn red when less than 10 seconds
  private onTimeExpired?: () => void;
  private flashingEffect: boolean = false;
  private flashRate: number = 500; // ms
  private flashTimer: number = 0;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    maxTime: number = 99
  ) {
    super(x, y, width, height);
    this.maxTime = maxTime;
    this.currentTime = maxTime;
  }

  /**
   * Start the timer countdown
   */
  public start(): void {
    this.isRunning = true;
  }

  /**
   * Pause the timer
   */
  public pause(): void {
    this.isRunning = false;
  }

  /**
   * Reset the timer to its initial value
   */
  public reset(): void {
    this.currentTime = this.maxTime;
    this.isRunning = false;
    this.flashingEffect = false;
  }

  /**
   * Set a callback function to be called when timer expires
   * @param callback Function to call on timer expiration
   */
  public onExpire(callback: () => void): void {
    this.onTimeExpired = callback;
  }

  /**
   * Set the maximum time for the timer
   * @param seconds Time in seconds
   */
  public setMaxTime(seconds: number): void {
    this.maxTime = seconds;
    this.reset();
  }

  /**
   * Get current time left on the timer
   * @returns Current time in seconds
   */
  public getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Update the timer state
   * @param deltaTime Time passed since last update in ms
   */
  public update(deltaTime: number): void {
    if (!this.isRunning) return;

    // Convert deltaTime from ms to seconds
    const deltaSeconds = deltaTime / 1000;
    this.currentTime = Math.max(0, this.currentTime - deltaSeconds);

    // Check if timer is below warning threshold
    if (this.currentTime <= this.warningThreshold) {
      this.flashingEffect = true;

      // Update flash timer
      this.flashTimer += deltaTime;
      if (this.flashTimer >= this.flashRate) {
        this.flashTimer = 0;
      }
    }

    // Check if timer has expired
    if (this.currentTime <= 0 && this.onTimeExpired) {
      this.isRunning = false;
      this.onTimeExpired();
    }
  }

  /**
   * Render the timer
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    // Format time as MM:SS
    const minutes = Math.floor(this.currentTime / 60);
    const seconds = Math.floor(this.currentTime % 60);
    const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    // Set up text appearance
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Determine text color based on time remaining and flashing effect
    if (this.flashingEffect) {
      // Flash effect when time is low
      if (this.flashTimer < this.flashRate / 2) {
        ctx.fillStyle = this.warningColor;
      } else {
        ctx.fillStyle = this.textColor;
      }
    } else {
      ctx.fillStyle =
        this.currentTime <= this.warningThreshold
          ? this.warningColor
          : this.textColor;
    }

    // Draw time text
    ctx.fillText(timeString, this.x + this.width / 2, this.y + this.height / 2);
  }
}
