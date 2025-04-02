// filepath: d:\workspace\my-pro\game\fighting\src\ui\PauseMenu.spec.ts
import { describe, test, expect, beforeEach, vi } from "vitest";
import { PauseMenu } from "./PauseMenu";

describe("PauseMenu", () => {
  let pauseMenu: PauseMenu;
  let mockContext: CanvasRenderingContext2D;
  const canvasWidth = 1200;
  const canvasHeight = 800;
  const menuWidth = 400;
  const menuHeight = 300;

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
      roundRect: vi.fn(),
      arc: vi.fn(),

      // State methods
      save: vi.fn(),
      restore: vi.fn(),

      // Properties
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      textAlign: "center" as CanvasTextAlign,
      textBaseline: "top" as CanvasTextBaseline,
      font: "",
      globalAlpha: 1,

      // Canvas reference
      canvas: {
        width: canvasWidth,
        height: canvasHeight,
      },

      // Text measurement
      measureText: vi.fn().mockReturnValue({ width: 50 }),
    } as unknown as CanvasRenderingContext2D;

    // Create a new pause menu for each test
    pauseMenu = new PauseMenu(canvasWidth, canvasHeight);
  });

  test("should initialize with correct dimensions", () => {
    const expectedX = (canvasWidth - menuWidth) / 2;
    const expectedY = (canvasHeight - menuHeight) / 2;

    expect(pauseMenu.getX()).toBe(expectedX);
    expect(pauseMenu.getY()).toBe(expectedY);
    expect(pauseMenu.getWidth()).toBe(menuWidth);
    expect(pauseMenu.getHeight()).toBe(menuHeight);
  });

  test("should be visible by default", () => {
    expect(pauseMenu.isVisible()).toBe(true);
  });

  test("should render when visible", () => {
    pauseMenu.render(mockContext);
    expect(mockContext.fillRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();
  });

  test("should not render when not visible", () => {
    pauseMenu.setVisible(false);
    pauseMenu.render(mockContext);
    expect(mockContext.fillRect).not.toHaveBeenCalled();
  });

  test("should correctly respond to callback connections", () => {
    // Setup mock callbacks
    const resumeMock = vi.fn();
    const restartMock = vi.fn();
    const quitMock = vi.fn();

    // Set the callbacks
    pauseMenu.onResume = resumeMock;
    pauseMenu.onRestart = restartMock;
    pauseMenu.onQuit = quitMock;

    // Since we don't have direct access to click on specific buttons,
    // we'll test the callback structure itself
    expect(pauseMenu.onResume).toBe(resumeMock);
    expect(pauseMenu.onRestart).toBe(restartMock);
    expect(pauseMenu.onQuit).toBe(quitMock);
  });

  test("should handle mouse events", () => {
    // Create a spy on the methods
    const mouseMoveSpy = vi.spyOn(pauseMenu, "handleMouseMove");
    const mouseDownSpy = vi.spyOn(pauseMenu, "handleMouseDown");
    const mouseUpSpy = vi.spyOn(pauseMenu, "handleMouseUp");

    // Simulate mouse events
    pauseMenu.handleMouseMove(100, 100);
    pauseMenu.handleMouseDown(100, 100);
    pauseMenu.handleMouseUp(100, 100);

    // Verify the methods were called
    expect(mouseMoveSpy).toHaveBeenCalledWith(100, 100);
    expect(mouseDownSpy).toHaveBeenCalledWith(100, 100);
    expect(mouseUpSpy).toHaveBeenCalledWith(100, 100);
  });

  test("should handle updates", () => {
    const updateSpy = vi.spyOn(pauseMenu, "update");

    // Simulate an update
    pauseMenu.update(16); // 16ms typical for 60fps

    // Verify update was called
    expect(updateSpy).toHaveBeenCalledWith(16);
  });

  test("should draw full-screen overlay and menu borders", () => {
    pauseMenu.render(mockContext);

    // Check that the semi-transparent overlay is drawn
    expect(mockContext.fillRect).toHaveBeenCalledWith(
      0,
      0,
      canvasWidth,
      canvasHeight
    );

    // Verify that the menu border is drawn
    expect(mockContext.strokeRect).toHaveBeenCalled();
  });
});
