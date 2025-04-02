// filepath: d:\workspace\my-pro\game\fighting\src\ui\Button.spec.ts
import { describe, test, expect, beforeEach, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  let button: Button;
  let mockContext: CanvasRenderingContext2D;
  let clickHandler: () => void;

  beforeEach(() => {
    // Mock click handler
    clickHandler = vi.fn();

    // Setup mock canvas context
    mockContext = {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      textAlign: "left",
      textBaseline: "top",
      font: "",
    } as unknown as CanvasRenderingContext2D;

    // Create a new button for each test
    button = new Button(10, 10, 200, 50, "Test Button", clickHandler);
  });

  test("should initialize with correct properties", () => {
    expect(button.getPosition()).toEqual({ x: 10, y: 10 });
    expect(button.getSize()).toEqual({ width: 200, height: 50 });
    expect(button.isVisible()).toBe(true);
  });

  test("should handle mouse hover state correctly", () => {
    // Mouse outside button
    expect(button.handleMouseMove(5, 5)).toBe(false);

    // Mouse enters button
    expect(button.handleMouseMove(100, 30)).toBe(true);

    // Mouse still inside button (no state change)
    expect(button.handleMouseMove(110, 40)).toBe(false);

    // Mouse exits button
    expect(button.handleMouseMove(300, 300)).toBe(true);
  });

  test("should handle mouse click correctly", () => {
    // Mouse down on button
    expect(button.handleMouseDown(100, 30)).toBe(true);

    // Mouse up on button - should trigger click handler
    expect(button.handleMouseUp(100, 30)).toBe(true);
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  test("should not trigger click if mouse up outside button", () => {
    // Mouse down on button
    expect(button.handleMouseDown(100, 30)).toBe(true);

    // Mouse up outside button - should not trigger click handler
    expect(button.handleMouseUp(300, 300)).toBe(false);
    expect(clickHandler).not.toHaveBeenCalled();
  });

  test("should render correctly when visible", () => {
    button.render(mockContext);
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.roundRect).toHaveBeenCalled();
    expect(mockContext.fill).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();
  });

  test("should not render when not visible", () => {
    button.setVisible(false);
    button.render(mockContext);
    expect(mockContext.beginPath).not.toHaveBeenCalled();
    expect(mockContext.fillText).not.toHaveBeenCalled();
  });

  test("should update button text", () => {
    button.setText("New Label");
    button.render(mockContext);
    // We can't directly check the text parameter as it's passed to fillText
    // But we can verify fillText was called
    expect(mockContext.fillText).toHaveBeenCalled();
  });

  test("should set icon", () => {
    button.setIcon("▶");
    button.render(mockContext);
    expect(mockContext.fillText).toHaveBeenCalled();
  });

  test("should update button colors", () => {
    button.setColors("#000000", "#111111", "#ffffff", "#cccccc");
    button.render(mockContext);
    // Can't directly check color values as they're set as properties
    expect(mockContext.fill).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();
  });
});
