// filepath: d:\workspace\my-pro\game\fighting\src\ui\Menu.spec.ts
import { describe, test, expect, beforeEach, vi } from "vitest";
import { Menu } from "./Menu";
import { Button } from "./Button";

describe("Menu", () => {
  let menu: Menu;
  let mockContext: CanvasRenderingContext2D;
  let mockButton1: Button;
  let mockButton2: Button;
  let buttonClickHandler: () => void;

  beforeEach(() => {
    // Setup mock canvas context with all needed methods
    mockContext = {
      // Basic drawing methods
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),

      // Path methods
      beginPath: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      rect: vi.fn(),
      roundRect: vi.fn(), // HTML5 canvas method
      arc: vi.fn(),

      // State methods
      save: vi.fn(),
      restore: vi.fn(),

      // Text measurement
      measureText: vi.fn().mockReturnValue({ width: 50 }),

      // Properties
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      textAlign: "left" as CanvasTextAlign,
      textBaseline: "top" as CanvasTextBaseline,
      font: "",
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    // Create mock buttons
    buttonClickHandler = vi.fn();
    mockButton1 = new Button(50, 100, 200, 40, "Button 1", buttonClickHandler);
    mockButton2 = new Button(50, 150, 200, 40, "Button 2", buttonClickHandler);

    // Spy on button methods
    vi.spyOn(mockButton1, "handleMouseMove");
    vi.spyOn(mockButton1, "handleMouseDown");
    vi.spyOn(mockButton1, "handleMouseUp");
    vi.spyOn(mockButton1, "update");
    vi.spyOn(mockButton1, "render");

    vi.spyOn(mockButton2, "handleMouseMove");
    vi.spyOn(mockButton2, "handleMouseDown");
    vi.spyOn(mockButton2, "handleMouseUp");
    vi.spyOn(mockButton2, "update");
    vi.spyOn(mockButton2, "render");

    // Create a new menu for each test
    menu = new Menu(0, 0, 800, 600, "Test Menu");
    menu.addButton(mockButton1);
    menu.addButton(mockButton2);
  });

  test("should initialize with correct properties", () => {
    expect(menu.getPosition()).toEqual({ x: 0, y: 0 });
    expect(menu.getSize()).toEqual({ width: 800, height: 600 });
    expect(menu.isVisible()).toBe(true);
  });

  test("should add buttons correctly", () => {
    const testMenu = new Menu(0, 0, 800, 600, "Empty Menu");
    expect(testMenu["buttons"].length).toBe(0);
    testMenu.addButton(mockButton1);
    expect(testMenu["buttons"].length).toBe(1);
    testMenu.addButton(mockButton2);
    expect(testMenu["buttons"].length).toBe(2);
  });

  test("should handle mouse move for all buttons", () => {
    menu.handleMouseMove(100, 120);
    expect(mockButton1.handleMouseMove).toHaveBeenCalledWith(100, 120);
    expect(mockButton2.handleMouseMove).toHaveBeenCalledWith(100, 120);
  });

  test("should handle mouse down for all buttons", () => {
    menu.handleMouseDown(100, 120);
    expect(mockButton1.handleMouseDown).toHaveBeenCalledWith(100, 120);
    expect(mockButton2.handleMouseDown).toHaveBeenCalledWith(100, 120);
  });

  test("should handle mouse up for all buttons", () => {
    menu.handleMouseUp(100, 120);
    expect(mockButton1.handleMouseUp).toHaveBeenCalledWith(100, 120);
    expect(mockButton2.handleMouseUp).toHaveBeenCalledWith(100, 120);
  });

  test("should update all buttons", () => {
    const deltaTime = 16.7; // approx 60fps
    menu.update(deltaTime);
    expect(mockButton1.update).toHaveBeenCalledWith(deltaTime);
    expect(mockButton2.update).toHaveBeenCalledWith(deltaTime);
  });

  test("should render all visible buttons", () => {
    menu.render(mockContext);
    // Check that rendering methods were called
    expect(mockContext.fillRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled(); // Title text
    expect(mockButton1.render).toHaveBeenCalledWith(mockContext);
    expect(mockButton2.render).toHaveBeenCalledWith(mockContext);
  });

  test("should not forward events when menu is not visible", () => {
    menu.setVisible(false);

    menu.handleMouseMove(100, 120);
    expect(mockButton1.handleMouseMove).not.toHaveBeenCalled();

    menu.handleMouseDown(100, 120);
    expect(mockButton1.handleMouseDown).not.toHaveBeenCalled();

    menu.handleMouseUp(100, 120);
    expect(mockButton1.handleMouseUp).not.toHaveBeenCalled();

    menu.update(16.7);
    expect(mockButton1.update).not.toHaveBeenCalled();

    menu.render(mockContext);
    expect(mockButton1.render).not.toHaveBeenCalled();
  });

  test("should not render invisible buttons", () => {
    mockButton1.setVisible(false);
    menu.render(mockContext);
    expect(mockButton1.render).not.toHaveBeenCalled();
    expect(mockButton2.render).toHaveBeenCalledWith(mockContext);
  });
});
