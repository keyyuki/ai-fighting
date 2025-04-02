import { describe, test, expect, beforeEach, vi } from "vitest";
import { Timer } from "./Timer";

describe("Timer", () => {
  let timer: Timer;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    // Setup mock canvas context
    mockContext = {
      fillText: vi.fn(),
      fillStyle: "",
      font: "",
      textAlign: "left",
      textBaseline: "top",
      canvas: { width: 800, height: 600 },
    } as unknown as CanvasRenderingContext2D;

    // Create a new timer for each test with 30 seconds
    timer = new Timer(10, 10, 100, 50, 30);
  });

  test("should initialize with correct time value", () => {
    expect(timer.getCurrentTime()).toBe(30);
  });

  test("should start and update time correctly", () => {
    timer.start();
    timer.update(1000); // Pass 1 second
    expect(timer.getCurrentTime()).toBeCloseTo(29, 1);
  });

  test("should pause and not update time", () => {
    timer.start();
    timer.pause();
    timer.update(1000); // Try to pass 1 second
    expect(timer.getCurrentTime()).toBe(30); // Time should remain unchanged
  });

  test("should reset to initial time", () => {
    timer.start();
    timer.update(5000); // Pass 5 seconds
    timer.reset();
    expect(timer.getCurrentTime()).toBe(30);
  });

  test("should call onTimeExpired callback when time reaches zero", () => {
    const onExpireMock = vi.fn();
    timer.onExpire(onExpireMock);
    timer.start();
    timer.update(30000); // Pass 30 seconds (entire duration)
    expect(onExpireMock).toHaveBeenCalled();
  });

  test("should enable flashing effect when time is below threshold", () => {
    timer.start();
    timer.update(21000); // Pass 21 seconds, leaving 9 seconds (below 10 second threshold)

    // Render the timer with warning effect
    timer.render(mockContext);
    expect(mockContext.fillText).toHaveBeenCalled();
    // Warning color should be used (this is an indirect test based on implementation)
  });

  test("should not render when not visible", () => {
    timer.setVisible(false);
    timer.render(mockContext);
    expect(mockContext.fillText).not.toHaveBeenCalled();
  });

  test("should set new max time correctly", () => {
    timer.setMaxTime(60);
    expect(timer.getCurrentTime()).toBe(60);
  });
});
