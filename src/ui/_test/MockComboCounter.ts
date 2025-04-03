import { UIComponent } from "../UIComponent";
import { vi } from "vitest";
import { ComboCounter } from "../ComboCounter";

/**
 * Mock implementation of ComboCounter for testing
 * This extends UIComponent directly to avoid recursion with mocked ComboCounter
 */
export class MockComboCounter extends UIComponent {
  incrementCombo: ReturnType<typeof vi.fn>;
  resetCombo: ReturnType<typeof vi.fn>;
  getComboCount: ReturnType<typeof vi.fn>;
  setColors: ReturnType<typeof vi.fn>;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    playerNumber: 1 | 2 = 1
  ) {
    super(x, y, width, height);

    // Mock all methods specific to ComboCounter
    this.incrementCombo = vi.fn().mockReturnValue(1);
    this.resetCombo = vi.fn();
    this.getComboCount = vi.fn().mockReturnValue(0);
    this.setColors = vi.fn();

    // Override UIComponent methods with mocks
    this.update = vi.fn();
    this.render = vi.fn();
    this.setVisible = vi.fn();
    this.isVisible = vi.fn().mockReturnValue(false);
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
Object.defineProperty(MockComboCounter.prototype, Symbol.hasInstance, {
  value: (instance: any) => {
    return (
      instance instanceof UIComponent ||
      instance instanceof ComboCounter ||
      instance instanceof MockComboCounter
    );
  },
});
