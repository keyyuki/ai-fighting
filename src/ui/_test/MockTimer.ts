import { UIComponent } from "../UIComponent";
import { vi } from "vitest";
import { Timer } from "../Timer";

/**
 * Mock implementation of Timer for testing
 * This extends UIComponent directly to avoid recursion with mocked Timer
 */
export class MockTimer extends UIComponent {
  start: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  onExpire: ReturnType<typeof vi.fn>;
  setMaxTime: ReturnType<typeof vi.fn>;
  getCurrentTime: ReturnType<typeof vi.fn>;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    maxTime: number = 99
  ) {
    super(x, y, width, height);

    // Mock all methods specific to Timer
    this.start = vi.fn();
    this.pause = vi.fn();
    this.reset = vi.fn();
    this.onExpire = vi.fn();
    this.setMaxTime = vi.fn();
    this.getCurrentTime = vi.fn().mockReturnValue(maxTime);

    // Override UIComponent methods with mocks
    this.update = vi.fn();
    this.render = vi.fn();
    this.setVisible = vi.fn();
    this.isVisible = vi.fn().mockReturnValue(true);
    this.setPosition = vi.fn();
    this.setSize = vi.fn();
    this.getPosition = vi.fn().mockReturnValue({ x, y });
    this.getSize = vi.fn().mockReturnValue({ width, height });
    this.getX = vi.fn().mockReturnValue(x);
    this.getY = vi.fn().mockReturnValue(y);
    this.getWidth = vi.fn().mockReturnValue(width);
    this.getHeight = vi.fn().mockReturnValue(height);
    this.containsPoint = vi.fn().mockReturnValue(false);
  }
}

// Make sure instanceof checks work with this mock
Object.defineProperty(MockTimer.prototype, Symbol.hasInstance, {
  value: (instance: any) => {
    return (
      instance instanceof UIComponent ||
      instance instanceof Timer ||
      instance instanceof MockTimer
    );
  },
});
