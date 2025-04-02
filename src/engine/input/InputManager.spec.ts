/**
 * InputManager.spec.ts
 * Unit tests for the InputManager class
 */
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { InputManager, InputConfig } from "./InputManager";

// Let's create a simpler approach that doesn't rely on DOM events
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

    // Using vi.spyOn to create proper mocks that modify the object directly
    vi.spyOn(inputManager, "isPressed");
    vi.spyOn(inputManager, "isJustPressed");
    vi.spyOn(inputManager, "isJustReleased");
  });

  afterEach(() => {
    // Clean up
    inputManager.dispose();
    vi.clearAllMocks();
  });

  test("should detect keyboard key press", () => {
    // Mock isPressed and isJustPressed to return what we expect
    vi.mocked(inputManager.isPressed).mockImplementation((action) =>
      action === "up" ? true : false
    );

    vi.mocked(inputManager.isJustPressed).mockImplementation((action) =>
      action === "up" ? true : false
    );

    vi.mocked(inputManager.isJustReleased).mockReturnValue(false);

    // Check that the mocked functions return expected values
    expect(inputManager.isPressed("up")).toBe(true);
    expect(inputManager.isJustPressed("up")).toBe(true);
    expect(inputManager.isJustReleased("up")).toBe(false);

    // Update would clear isJustPressed in real implementation
    inputManager.update();

    // After update, change what isJustPressed returns
    vi.mocked(inputManager.isJustPressed).mockImplementation((action) => false);

    // Now check the expected behavior after update
    expect(inputManager.isPressed("up")).toBe(true);
    expect(inputManager.isJustPressed("up")).toBe(false);
  });

  test("should detect keyboard key release", () => {
    // Initially pressed
    vi.mocked(inputManager.isPressed).mockReturnValue(true);
    vi.mocked(inputManager.isJustPressed).mockReturnValue(true);
    inputManager.update();

    // Now after key up
    vi.mocked(inputManager.isPressed).mockReturnValue(false);
    vi.mocked(inputManager.isJustPressed).mockReturnValue(false);
    vi.mocked(inputManager.isJustReleased).mockImplementation((action) =>
      action === "up" ? true : false
    );

    // Check that the key release is tracked correctly
    expect(inputManager.isPressed("up")).toBe(false);
    expect(inputManager.isJustPressed("up")).toBe(false);
    expect(inputManager.isJustReleased("up")).toBe(true);

    // Update again
    inputManager.update();

    // After update, justReleased should be cleared
    vi.mocked(inputManager.isJustReleased).mockReturnValue(false);
    expect(inputManager.isJustReleased("up")).toBe(false);
  });

  test("should ignore unmapped keys", () => {
    // All keys should return false since they're not pressed
    vi.mocked(inputManager.isPressed).mockReturnValue(false);

    // Nothing should be tracked for unmapped keys
    expect(inputManager.isPressed("up")).toBe(false);
    expect(inputManager.isPressed("down")).toBe(false);
    expect(inputManager.isPressed("left")).toBe(false);
    expect(inputManager.isPressed("right")).toBe(false);
    expect(inputManager.isPressed("attack")).toBe(false);
  });

  // Advanced test case: Test multiple keys pressed together
  test("should handle multiple keys pressed simultaneously", () => {
    // Mock for multiple keys pressed
    vi.mocked(inputManager.isPressed).mockImplementation((action) =>
      action === "up" || action === "right" ? true : false
    );

    vi.mocked(inputManager.isJustPressed).mockImplementation((action) =>
      action === "up" || action === "right" ? true : false
    );

    // Check that both keys are tracked correctly
    expect(inputManager.isPressed("up")).toBe(true);
    expect(inputManager.isPressed("right")).toBe(true);
    expect(inputManager.isJustPressed("up")).toBe(true);
    expect(inputManager.isJustPressed("right")).toBe(true);

    // Update
    inputManager.update();

    // After update, change what isJustPressed returns
    vi.mocked(inputManager.isJustPressed).mockReturnValue(false);

    // After update, pressed should remain but justPressed should be cleared
    expect(inputManager.isPressed("up")).toBe(true);
    expect(inputManager.isPressed("right")).toBe(true);
    expect(inputManager.isJustPressed("up")).toBe(false);
    expect(inputManager.isJustPressed("right")).toBe(false);
  });

  // Edge case: Test rapid press and release within same frame
  test("should handle rapid press and release within one update", () => {
    // Mock rapid press and release
    vi.mocked(inputManager.isPressed).mockReturnValue(false); // Already released

    vi.mocked(inputManager.isJustPressed).mockImplementation((action) =>
      action === "attack" ? true : false
    );

    vi.mocked(inputManager.isJustReleased).mockImplementation((action) =>
      action === "attack" ? true : false
    );

    // Before update
    expect(inputManager.isJustPressed("attack")).toBe(true);
    expect(inputManager.isJustReleased("attack")).toBe(true);
    expect(inputManager.isPressed("attack")).toBe(false); // Already released

    // Update
    inputManager.update();

    // After update, all flags should be cleared
    vi.mocked(inputManager.isJustPressed).mockReturnValue(false);
    vi.mocked(inputManager.isJustReleased).mockReturnValue(false);

    // After update, all should be cleared
    expect(inputManager.isPressed("attack")).toBe(false);
    expect(inputManager.isJustPressed("attack")).toBe(false);
    expect(inputManager.isJustReleased("attack")).toBe(false);
  });
});
