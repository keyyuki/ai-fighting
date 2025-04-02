/**
 * InputManager.spec.ts
 * Unit tests for the InputManager class
 */
import { InputManager, InputConfig } from "./InputManager";

describe("InputManager", () => {
  let inputManager: InputManager;
  const mockConfig: InputConfig = {
    keyboard: {
      KeyW: "up",
      KeyS: "down",
      KeyA: "left",
      KeyD: "right",
      Space: "attack",
    },
    gamepad: {
      button_0: "attack",
      button_1: "special",
      axis_0_positive: "right",
      axis_0_negative: "left",
      axis_1_positive: "down",
      axis_1_negative: "up",
    },
  };

  beforeEach(() => {
    // Create a fresh InputManager before each test
    inputManager = new InputManager(mockConfig);
  });

  afterEach(() => {
    // Clean up event listeners after each test
    inputManager.dispose();
  });

  // Test keyboard input events
  test("should detect keyboard key press", () => {
    // Simulate a key press event
    const event = new KeyboardEvent("keydown", { code: "KeyW", bubbles: true });
    window.dispatchEvent(event);

    // Check that the key is tracked correctly
    expect(inputManager.isPressed("up")).toBe(true);
    expect(inputManager.isJustPressed("up")).toBe(true);
    expect(inputManager.isJustReleased("up")).toBe(false);

    // Update the input manager (which would normally happen in the game loop)
    inputManager.update();

    // After update, justPressed should be cleared, but pressed should remain
    expect(inputManager.isPressed("up")).toBe(true);
    expect(inputManager.isJustPressed("up")).toBe(false);
  });

  test("should detect keyboard key release", () => {
    // Simulate key press and release
    const downEvent = new KeyboardEvent("keydown", {
      code: "KeyW",
      bubbles: true,
    });
    window.dispatchEvent(downEvent);
    inputManager.update();

    const upEvent = new KeyboardEvent("keyup", { code: "KeyW", bubbles: true });
    window.dispatchEvent(upEvent);

    // Check that the key release is tracked correctly
    expect(inputManager.isPressed("up")).toBe(false);
    expect(inputManager.isJustPressed("up")).toBe(false);
    expect(inputManager.isJustReleased("up")).toBe(true);

    // Update again
    inputManager.update();

    // After update, justReleased should also be cleared
    expect(inputManager.isJustReleased("up")).toBe(false);
  });

  test("should ignore unmapped keys", () => {
    // Simulate an unmapped key press
    const event = new KeyboardEvent("keydown", { code: "KeyZ", bubbles: true });
    window.dispatchEvent(event);

    // Nothing should be tracked for this key
    expect(inputManager.isPressed("up")).toBe(false);
    expect(inputManager.isPressed("down")).toBe(false);
    expect(inputManager.isPressed("left")).toBe(false);
    expect(inputManager.isPressed("right")).toBe(false);
    expect(inputManager.isPressed("attack")).toBe(false);
  });

  // Advanced test case: Test multiple keys pressed together
  test("should handle multiple keys pressed simultaneously", () => {
    // Press multiple keys
    const event1 = new KeyboardEvent("keydown", {
      code: "KeyW",
      bubbles: true,
    });
    const event2 = new KeyboardEvent("keydown", {
      code: "KeyD",
      bubbles: true,
    });

    window.dispatchEvent(event1);
    window.dispatchEvent(event2);

    // Check that both keys are tracked correctly
    expect(inputManager.isPressed("up")).toBe(true);
    expect(inputManager.isPressed("right")).toBe(true);
    expect(inputManager.isJustPressed("up")).toBe(true);
    expect(inputManager.isJustPressed("right")).toBe(true);

    // Update
    inputManager.update();

    // After update, pressed should remain but justPressed should be cleared
    expect(inputManager.isPressed("up")).toBe(true);
    expect(inputManager.isPressed("right")).toBe(true);
    expect(inputManager.isJustPressed("up")).toBe(false);
    expect(inputManager.isJustPressed("right")).toBe(false);
  });

  // Edge case: Test rapid press and release within same frame
  test("should handle rapid press and release within one update", () => {
    // Press and release a key
    const downEvent = new KeyboardEvent("keydown", {
      code: "Space",
      bubbles: true,
    });
    window.dispatchEvent(downEvent);

    const upEvent = new KeyboardEvent("keyup", {
      code: "Space",
      bubbles: true,
    });
    window.dispatchEvent(upEvent);

    // Before update, the key should be both just pressed and just released
    expect(inputManager.isJustPressed("attack")).toBe(true);
    expect(inputManager.isJustReleased("attack")).toBe(true);
    expect(inputManager.isPressed("attack")).toBe(false); // Already released

    // Update
    inputManager.update();

    // After update, all should be cleared
    expect(inputManager.isPressed("attack")).toBe(false);
    expect(inputManager.isJustPressed("attack")).toBe(false);
    expect(inputManager.isJustReleased("attack")).toBe(false);
  });

  // Note: Gamepad API is harder to test in a unit test environment
  // as it requires mocking Navigator.getGamepads()
  // Normally this would be tested with more complex mocking or in integration tests
});
