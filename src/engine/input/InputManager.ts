/**
 * InputManager.ts
 * Handles keyboard and gamepad input detection for the game
 */

export type InputKey = string;

export interface InputConfig {
  keyboard?: {
    [key: string]: InputKey;
  };
  gamepad?: {
    [button: string]: InputKey;
  };
}

export interface InputState {
  pressed: Set<InputKey>;
  justPressed: Set<InputKey>;
  justReleased: Set<InputKey>;
}

/**
 * Determines if code is running in a browser environment
 */
const isBrowser = typeof window !== "undefined";

/**
 * Manages keyboard and gamepad inputs
 */
export class InputManager {
  private keyboardConfig: { [key: string]: InputKey };
  private gamepadConfig: { [button: string]: InputKey };

  private currentState: InputState = {
    pressed: new Set<InputKey>(),
    justPressed: new Set<InputKey>(),
    justReleased: new Set<InputKey>(),
  };

  private previousState: InputState = {
    pressed: new Set<InputKey>(),
    justPressed: new Set<InputKey>(),
    justReleased: new Set<InputKey>(),
  };

  private gamepads: Map<number, Gamepad> = new Map();
  private gamepadButtonsPressed: Set<string> = new Set();

  /**
   * Creates a new InputManager instance
   * @param config Configuration for key mappings
   */
  constructor(config: InputConfig = {}) {
    this.keyboardConfig = config.keyboard || {};
    this.gamepadConfig = config.gamepad || {};

    if (isBrowser) {
      // Setup event listeners in browser environment
      window.addEventListener("keydown", this.handleKeyDown);
      window.addEventListener("keyup", this.handleKeyUp);

      // Gamepad API event listeners
      window.addEventListener("gamepadconnected", this.handleGamepadConnected);
      window.addEventListener(
        "gamepaddisconnected",
        this.handleGamepadDisconnected
      );
    }
  }

  /**
   * Update the input state (should be called each frame)
   */
  public update(): void {
    // Clear the temporary states
    this.currentState.justPressed.clear();
    this.currentState.justReleased.clear();

    // Copy current state to previous state
    this.previousState = {
      pressed: new Set(this.currentState.pressed),
      justPressed: new Set(),
      justReleased: new Set(),
    };

    // Update gamepad state
    if (isBrowser) {
      this.updateGamepadState();
    }
  }

  /**
   * Check if a key is currently pressed
   * @param key The key to check
   * @returns True if the key is pressed
   */
  public isPressed(key: InputKey): boolean {
    return this.currentState.pressed.has(key);
  }

  /**
   * Check if a key was just pressed this frame
   * @param key The key to check
   * @returns True if the key was just pressed
   */
  public isJustPressed(key: InputKey): boolean {
    return this.currentState.justPressed.has(key);
  }

  /**
   * Check if a key was just released this frame
   * @param key The key to check
   * @returns True if the key was just released
   */
  public isJustReleased(key: InputKey): boolean {
    return this.currentState.justReleased.has(key);
  }

  /**
   * Simulate a key press (useful for testing and AI)
   * @param key The key to simulate pressing
   */
  public simulateKeyPress(key: InputKey): void {
    if (!this.currentState.pressed.has(key)) {
      this.currentState.justPressed.add(key);
    }
    this.currentState.pressed.add(key);
  }

  /**
   * Simulate a key release (useful for testing and AI)
   * @param key The key to simulate releasing
   */
  public simulateKeyRelease(key: InputKey): void {
    if (this.currentState.pressed.has(key)) {
      this.currentState.justReleased.add(key);
      this.currentState.pressed.delete(key);
    }
  }

  /**
   * Cleanup event listeners
   */
  public dispose(): void {
    if (isBrowser) {
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("keyup", this.handleKeyUp);
      window.removeEventListener(
        "gamepadconnected",
        this.handleGamepadConnected
      );
      window.removeEventListener(
        "gamepaddisconnected",
        this.handleGamepadDisconnected
      );
    }
  }

  /**
   * Handle keyboard key down events
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    const mappedKey = this.keyboardConfig[event.code];
    if (mappedKey) {
      // Only add to justPressed if it wasn't already pressed
      if (!this.currentState.pressed.has(mappedKey)) {
        this.currentState.justPressed.add(mappedKey);
      }
      this.currentState.pressed.add(mappedKey);
    }
  };

  /**
   * Handle keyboard key up events
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    const mappedKey = this.keyboardConfig[event.code];
    if (mappedKey) {
      this.currentState.pressed.delete(mappedKey);
      this.currentState.justReleased.add(mappedKey);
    }
  };

  /**
   * Handle gamepad connected events
   */
  private handleGamepadConnected = (event: GamepadEvent): void => {
    this.gamepads.set(event.gamepad.index, event.gamepad);
  };

  /**
   * Handle gamepad disconnected events
   */
  private handleGamepadDisconnected = (event: GamepadEvent): void => {
    this.gamepads.delete(event.gamepad.index);
  };

  /**
   * Update gamepad state from Gamepad API
   */
  private updateGamepadState(): void {
    if (!isBrowser || !navigator.getGamepads) return;

    // Get the latest gamepad data
    const gamepads = navigator.getGamepads();

    // Clear previous gamepad button states
    this.gamepadButtonsPressed.clear();

    // Process each connected gamepad
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        // Process buttons
        for (let j = 0; j < gamepad.buttons.length; j++) {
          const buttonKey = `button_${j}`;
          const mappedKey = this.gamepadConfig[buttonKey];
          if (mappedKey && gamepad.buttons[j].pressed) {
            // Mark this button as currently pressed for this update
            this.gamepadButtonsPressed.add(mappedKey);

            // If not already pressed, add to justPressed
            if (!this.previousState.pressed.has(mappedKey)) {
              this.currentState.justPressed.add(mappedKey);
            }
            this.currentState.pressed.add(mappedKey);
          }
        }

        // Process axes (for D-pad or analog stick)
        this.processGamepadAxes(gamepad);
      }
    }

    // Find keys that were pressed before but are no longer pressed
    this.previousState.pressed.forEach((key) => {
      // For gamepad buttons
      if (Object.values(this.gamepadConfig).includes(key)) {
        if (!this.gamepadButtonsPressed.has(key)) {
          this.currentState.pressed.delete(key);
          this.currentState.justReleased.add(key);
        }
      }
    });
  }

  /**
   * Process gamepad axes for directional input
   */
  private processGamepadAxes(gamepad: Gamepad): void {
    // Process left analog stick or D-pad
    // Horizontal axis (typically axis 0)
    if (gamepad.axes.length > 0) {
      const horizontalAxis = gamepad.axes[0];

      // Right
      if (horizontalAxis > 0.5) {
        const mappedKey = this.gamepadConfig["axis_0_positive"];
        if (mappedKey) {
          this.gamepadButtonsPressed.add(mappedKey);
          if (!this.previousState.pressed.has(mappedKey)) {
            this.currentState.justPressed.add(mappedKey);
          }
          this.currentState.pressed.add(mappedKey);
        }
      }
      // Left
      else if (horizontalAxis < -0.5) {
        const mappedKey = this.gamepadConfig["axis_0_negative"];
        if (mappedKey) {
          this.gamepadButtonsPressed.add(mappedKey);
          if (!this.previousState.pressed.has(mappedKey)) {
            this.currentState.justPressed.add(mappedKey);
          }
          this.currentState.pressed.add(mappedKey);
        }
      }
    }

    // Vertical axis (typically axis 1)
    if (gamepad.axes.length > 1) {
      const verticalAxis = gamepad.axes[1];

      // Down
      if (verticalAxis > 0.5) {
        const mappedKey = this.gamepadConfig["axis_1_positive"];
        if (mappedKey) {
          this.gamepadButtonsPressed.add(mappedKey);
          if (!this.previousState.pressed.has(mappedKey)) {
            this.currentState.justPressed.add(mappedKey);
          }
          this.currentState.pressed.add(mappedKey);
        }
      }
      // Up
      else if (verticalAxis < -0.5) {
        const mappedKey = this.gamepadConfig["axis_1_negative"];
        if (mappedKey) {
          this.gamepadButtonsPressed.add(mappedKey);
          if (!this.previousState.pressed.has(mappedKey)) {
            this.currentState.justPressed.add(mappedKey);
          }
          this.currentState.pressed.add(mappedKey);
        }
      }
    }
  }
}
