/**
 * Unit tests for the GameLoop implementation
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GameLoop, GameLoopCallbacks } from "./GameLoop";

describe("GameLoop", () => {
  // Save original methods
  const originalRAF = global.requestAnimationFrame;
  const originalCAF = global.cancelAnimationFrame;
  let mockTime = 1000;

  beforeEach(() => {
    mockTime = 1000;

    // Set up fake timers
    vi.useFakeTimers();

    // Mock performance.now to return our controlled time
    vi.spyOn(performance, "now").mockImplementation(() => mockTime);

    // Mock requestAnimationFrame to call the callback with our controlled timestamp
    let frameId = 0;
    global.requestAnimationFrame = vi.fn((callback) => {
      const id = ++frameId;

      // Schedule the callback to run on next tick with our controlled time
      setTimeout(() => {
        // Advance time before calling the callback
        mockTime += 16.67; // ~60fps
        callback(mockTime);
      }, 0);

      return id;
    });

    // Mock cancelAnimationFrame
    global.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    // Restore original functions
    vi.restoreAllMocks();
    vi.useRealTimers();
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCAF;
  });

  it("should create a GameLoop with default options", () => {
    const callbacks = {
      update: vi.fn(),
      render: vi.fn(),
    };

    const gameLoop = new GameLoop(callbacks);
    expect(gameLoop).toBeDefined();
  });

  it("should start and stop the game loop", () => {
    const callbacks = {
      update: vi.fn(),
      render: vi.fn(),
    };

    const gameLoop = new GameLoop(callbacks);
    gameLoop.start();

    // Wait for at least one frame
    expect(global.requestAnimationFrame).toHaveBeenCalled();

    gameLoop.stop();
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });

  it("should call update and render callbacks", () => {
    const callbacks: GameLoopCallbacks = {
      update: vi.fn(),
      render: vi.fn(),
    };

    const gameLoop = new GameLoop(callbacks);
    gameLoop.start();

    // Manually trigger first animation frame callback
    const rafCallback = vi.mocked(global.requestAnimationFrame).mock
      .calls[0][0];
    rafCallback(mockTime + 16.67);

    // Stop the game loop to prevent infinite recursion
    gameLoop.stop();

    // Verify the callbacks were called
    expect(callbacks.update).toHaveBeenCalled();
    expect(callbacks.render).toHaveBeenCalled();
  });

  it("should handle fixed timestep updates", () => {
    const callbacks: GameLoopCallbacks = {
      update: vi.fn(),
      render: vi.fn(),
    };

    // Create game loop with custom update interval of 100ms
    const gameLoop = new GameLoop(callbacks, { updateInterval: 100 });
    gameLoop.start();

    // Manually trigger a game loop tick with a 200ms delta time
    mockTime += 200; // Jump forward 200ms
    const rafCallback = vi.mocked(global.requestAnimationFrame).mock
      .calls[0][0];
    rafCallback(mockTime);

    // Should have called update twice (200ms ÷ 100ms = 2 updates)
    expect(callbacks.update).toHaveBeenCalledTimes(2);

    gameLoop.stop();
  });

  it("should calculate interpolation for smooth rendering", () => {
    const callbacks: GameLoopCallbacks = {
      update: vi.fn(),
      render: vi.fn(),
    };

    // Create game loop with update interval of 100ms
    const gameLoop = new GameLoop(callbacks, { updateInterval: 100 });
    gameLoop.start();

    // Jump ahead by 150ms (should result in 1 update with 50ms remaining in accumulator)
    mockTime += 150;
    const rafCallback = vi.mocked(global.requestAnimationFrame).mock
      .calls[0][0];
    rafCallback(mockTime);

    // Should have called update once
    expect(callbacks.update).toHaveBeenCalledTimes(1);

    // Render should have been called with interpolation value of ~0.5 (50ms / 100ms)
    expect(callbacks.render).toHaveBeenCalledWith(expect.closeTo(0.5, 0.1));

    gameLoop.stop();
  });
});
