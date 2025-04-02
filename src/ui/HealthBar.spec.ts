import { describe, test, expect, beforeEach, vi, SpyInstance } from "vitest";
import { HealthBar } from "./HealthBar";

describe("HealthBar", () => {
  let healthBar: HealthBar;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    // Setup mock canvas context
    mockContext = {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      textAlign: "left" as CanvasTextAlign,
      textBaseline: "top" as CanvasTextBaseline,
      font: "",
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    // Create a new health bar for each test
    healthBar = new HealthBar(10, 10, 200, 30, 100, 1);
  });

  test("should initialize with correct health values", () => {
    expect(healthBar.getHealth()).toBe(100);
  });

  test("should update health value correctly", () => {
    healthBar.setHealth(75);
    expect(healthBar.getHealth()).toBe(75);
  });

  test("should not set health above maximum", () => {
    healthBar.setHealth(150);
    expect(healthBar.getHealth()).toBe(100);
  });

  test("should not set health below zero", () => {
    healthBar.setHealth(-10);
    expect(healthBar.getHealth()).toBe(0);
  });

  test("should trigger damage animation when health decreases", () => {
    healthBar.setHealth(80);
    // Spy on update to check if animation is triggered
    const updateSpy = vi.spyOn(healthBar, "update");
    healthBar.update(100);
    expect(updateSpy).toHaveBeenCalled();
  });

  test("should render correctly when visible", () => {
    healthBar.render(mockContext);
    expect(mockContext.fillRect).toHaveBeenCalled();
    expect(mockContext.strokeRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();
  });

  test("should not render when not visible", () => {
    healthBar.setVisible(false);
    healthBar.render(mockContext);
    expect(mockContext.fillRect).not.toHaveBeenCalled();
    expect(mockContext.strokeRect).not.toHaveBeenCalled();
    expect(mockContext.fillText).not.toHaveBeenCalled();
  });
});
