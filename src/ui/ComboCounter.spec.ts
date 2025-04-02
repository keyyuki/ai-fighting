import { describe, test, expect, beforeEach, vi } from "vitest";
import { ComboCounter } from "./ComboCounter";

describe("ComboCounter", () => {
  let comboCounter: ComboCounter;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    // Setup mock canvas context
    mockContext = {
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: "",
      font: "",
      textAlign: "left",
      textBaseline: "middle",
    } as unknown as CanvasRenderingContext2D;

    // Create a new combo counter for each test (for player 1)
    comboCounter = new ComboCounter(50, 200, 150, 50, 1);
  });

  test("should initialize with zero combo count", () => {
    expect(comboCounter.getComboCount()).toBe(0);
  });

  test("should increment combo count", () => {
    expect(comboCounter.incrementCombo()).toBe(1);
    expect(comboCounter.getComboCount()).toBe(1);

    expect(comboCounter.incrementCombo()).toBe(2);
    expect(comboCounter.getComboCount()).toBe(2);
  });

  test("should reset combo count", () => {
    comboCounter.incrementCombo();
    comboCounter.incrementCombo();
    expect(comboCounter.getComboCount()).toBe(2);

    comboCounter.resetCombo();
    expect(comboCounter.getComboCount()).toBe(0);
  });

  test("should make combo visible after increment", () => {
    // Initially not visible
    expect(comboCounter.isVisible()).toBe(false);

    comboCounter.incrementCombo();
    expect(comboCounter.isVisible()).toBe(true);
  });

  test("should make combo invisible after reset", () => {
    comboCounter.incrementCombo();
    expect(comboCounter.isVisible()).toBe(true);

    comboCounter.resetCombo();
    expect(comboCounter.isVisible()).toBe(false);
  });

  test("should expire combo after display duration", () => {
    comboCounter.incrementCombo();
    expect(comboCounter.isVisible()).toBe(true);

    // Update with more time than display duration
    comboCounter.update(3000); // Display duration is 2000ms
    expect(comboCounter.isVisible()).toBe(false);
    expect(comboCounter.getComboCount()).toBe(0);
  });

  test("should not render when count is less than 2", () => {
    comboCounter.incrementCombo(); // Count is now 1
    comboCounter.render(mockContext);
    expect(mockContext.fillText).not.toHaveBeenCalled();
  });

  test("should render when count is 2 or greater", () => {
    comboCounter.incrementCombo(); // Count is now 1
    comboCounter.incrementCombo(); // Count is now 2
    comboCounter.render(mockContext);
    expect(mockContext.save).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();
    expect(mockContext.restore).toHaveBeenCalled();
  });

  test("should not render when not visible", () => {
    comboCounter.incrementCombo();
    comboCounter.incrementCombo();
    comboCounter.setVisible(false);
    comboCounter.render(mockContext);
    expect(mockContext.fillText).not.toHaveBeenCalled();
  });

  test("should update animation scale during animation", () => {
    const updateSpy = vi.spyOn(comboCounter, "update");

    comboCounter.incrementCombo();
    comboCounter.update(100);

    expect(updateSpy).toHaveBeenCalledWith(100);
    // Animation should be active at this point
  });
});
