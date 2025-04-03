import { UIComponent } from "../UIComponent";
import { vi } from "vitest";
import { HealthBar } from "../HealthBar";

/**
 * Mock implementation of HealthBar for testing
 * This extends UIComponent directly to avoid recursion with mocked HealthBar
 */
export class MockHealthBar extends UIComponent {
  setHealth: ReturnType<typeof vi.fn>;
  getHealth: ReturnType<typeof vi.fn>;
  getMaxHealth: ReturnType<typeof vi.fn>;
  getHealthPercentage: ReturnType<typeof vi.fn>;
  setColors: ReturnType<typeof vi.fn>;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    maxHealth: number = 100,
    playerNumber: 1 | 2 = 1
  ) {
    super(x, y, width, height);

    // Mock all methods specific to HealthBar
    this.setHealth = vi.fn();
    this.getHealth = vi.fn().mockReturnValue(maxHealth);
    this.getMaxHealth = vi.fn().mockReturnValue(maxHealth);
    this.getHealthPercentage = vi.fn().mockReturnValue(100);
    this.setColors = vi.fn();

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
Object.defineProperty(MockHealthBar.prototype, Symbol.hasInstance, {
  value: (instance: any) => {
    return (
      instance instanceof UIComponent ||
      instance instanceof HealthBar ||
      instance instanceof MockHealthBar
    );
  },
});
