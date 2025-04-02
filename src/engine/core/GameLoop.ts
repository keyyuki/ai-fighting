/**
 * GameLoop.ts
 * Core game loop implementation for the fighting game
 * Handles the update and render timing
 */

export interface GameLoopOptions {
  /**
   * Fixed update interval in milliseconds (default: 16.67ms = ~60fps)
   */
  updateInterval?: number;

  /**
   * Maximum allowed delta time in milliseconds to prevent spiral of death
   */
  maxDeltaTime?: number;
}

export interface GameLoopCallbacks {
  /**
   * Called at fixed intervals for game logic updates
   * @param deltaTime Time since last update in seconds
   */
  update: (deltaTime: number) => void;

  /**
   * Called as often as possible for rendering
   * @param interpolation Value between 0 and 1 representing position between update frames
   */
  render: (interpolation: number) => void;
}

/**
 * Game Loop using fixed time steps for physics/logic and variable time steps for rendering
 */
export class GameLoop {
  private running: boolean = false;
  private lastTimestamp: number = 0;
  private accumulator: number = 0;
  private updateInterval: number;
  private maxDeltaTime: number;
  private animationFrameId: number | null = null;
  private callbacks: GameLoopCallbacks;
  private fpsCounter: { frames: number; lastCheck: number; value: number } = {
    frames: 0,
    lastCheck: 0,
    value: 0,
  };

  /**
   * Creates a new GameLoop instance
   * @param callbacks Object with update and render callback functions
   * @param options Configuration options for the game loop
   */
  constructor(callbacks: GameLoopCallbacks, options: GameLoopOptions = {}) {
    this.callbacks = callbacks;
    this.updateInterval = options.updateInterval ?? 1000 / 60; // Default to ~60 FPS
    this.maxDeltaTime = options.maxDeltaTime ?? 250; // Default max delta time (ms)
  }

  /**
   * Starts the game loop
   */
  public start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTimestamp = performance.now();
    this.fpsCounter.lastCheck = this.lastTimestamp;

    // Start the loop
    this.tick();
  }

  /**
   * Stops the game loop
   */
  public stop(): void {
    if (!this.running) return;

    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get the current FPS value
   * @returns Current frames per second
   */
  public getFPS(): number {
    return this.fpsCounter.value;
  }

  /**
   * The main loop function
   * @param timestamp Current timestamp from requestAnimationFrame
   */
  private tick = (timestamp: number = performance.now()): void => {
    if (!this.running) return;

    // Calculate delta time since last frame
    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Update FPS counter
    this.updateFPSCounter(timestamp);

    // Clamp delta time to prevent spiral of death
    const clampedDeltaTime = Math.min(deltaTime, this.maxDeltaTime);

    // Add to accumulator
    this.accumulator += clampedDeltaTime;

    // Fixed update step
    const updateIntervalInSeconds = this.updateInterval / 1000;
    while (this.accumulator >= this.updateInterval) {
      this.callbacks.update(updateIntervalInSeconds);
      this.accumulator -= this.updateInterval;
    }

    // Calculate interpolation for smooth rendering between physics updates
    const interpolation = this.accumulator / this.updateInterval;

    // Render
    this.callbacks.render(interpolation);

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Updates the FPS counter approximately once per second
   * @param timestamp Current timestamp
   */
  private updateFPSCounter(timestamp: number): void {
    this.fpsCounter.frames++;

    // Update FPS counter approximately once per second
    if (timestamp - this.fpsCounter.lastCheck >= 1000) {
      // Calculate FPS: frames / seconds
      this.fpsCounter.value = Math.round(
        (this.fpsCounter.frames * 1000) /
          (timestamp - this.fpsCounter.lastCheck)
      );

      // Reset counter
      this.fpsCounter.frames = 0;
      this.fpsCounter.lastCheck = timestamp;
    }
  }
}
