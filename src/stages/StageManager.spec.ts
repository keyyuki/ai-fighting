/**
 * StageManager.spec.ts
 * Tests for the StageManager class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StageManager } from "./StageManager";
import { IStage, StageConfig } from "./interface/IStage";
import { Stage } from "./Stage";

// Create mock stage classes for testing
class MockStage implements IStage {
  private id: string;
  private name: string;
  private description: string;
  private boundaries: any;

  constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.boundaries = { left: 0, right: 1000, floor: 500 };
  }

  getId(): string {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getDescription(): string {
    return this.description;
  }
  getBoundaries(): any {
    return this.boundaries;
  }
  getFloorY(): number {
    return 500;
  }
  getLayer(): any {
    return undefined;
  }
  getLayers(): any[] {
    return [];
  }

  initialize = vi.fn().mockResolvedValue(undefined);
  update = vi.fn();
  render = vi.fn();
  playMusic = vi.fn();
  stopMusic = vi.fn();
  playAmbientSound = vi.fn();
  playEventSound = vi.fn();
}

describe("StageManager", () => {
  let stageManager: StageManager;
  let mockStage1: IStage;
  let mockStage2: IStage;

  beforeEach(() => {
    stageManager = new StageManager();
    mockStage1 = new MockStage("stage1", "Stage One", "First test stage");
    mockStage2 = new MockStage("stage2", "Stage Two", "Second test stage");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should register and retrieve stages correctly", () => {
    stageManager.registerStage(mockStage1);
    stageManager.registerStage(mockStage2);

    // Check both stages were registered
    expect(stageManager.getAllStages().length).toBe(2);

    // Check we can retrieve them by ID
    expect(stageManager.getStage("stage1")).toBe(mockStage1);
    expect(stageManager.getStage("stage2")).toBe(mockStage2);

    // Check hasStage functionality
    expect(stageManager.hasStage("stage1")).toBe(true);
    expect(stageManager.hasStage("nonexistent")).toBe(false);
  });

  it("should not allow duplicate stage registrations", () => {
    stageManager.registerStage(mockStage1);

    // Try to register a stage with the same ID
    const duplicateStage = new MockStage(
      "stage1",
      "Duplicate",
      "Should not register"
    );
    expect(() => stageManager.registerStage(duplicateStage)).toThrow();

    // Verify we still only have one stage
    expect(stageManager.getAllStages().length).toBe(1);
  });

  it("should unregister stages correctly", () => {
    stageManager.registerStage(mockStage1);
    stageManager.registerStage(mockStage2);

    // Unregister a stage
    const result = stageManager.unregisterStage("stage1");
    expect(result).toBe(true);

    // Check it was removed
    expect(stageManager.getAllStages().length).toBe(1);
    expect(stageManager.getStage("stage1")).toBeUndefined();

    // Try to unregister a non-existent stage
    const failedResult = stageManager.unregisterStage("nonexistent");
    expect(failedResult).toBe(false);
  });

  it("should set and get current stage correctly", async () => {
    stageManager.registerStage(mockStage1);
    stageManager.registerStage(mockStage2);

    // Initially there should be no current stage
    expect(stageManager.getCurrentStage()).toBeUndefined();

    // Set current stage
    await stageManager.setCurrentStage("stage1");
    expect(stageManager.getCurrentStage()).toBe(mockStage1);

    // Change current stage
    await stageManager.setCurrentStage("stage2");
    expect(stageManager.getCurrentStage()).toBe(mockStage2);

    // Initialization should be called when setting stage
    expect(mockStage1.initialize).toHaveBeenCalledTimes(1);
    expect(mockStage2.initialize).toHaveBeenCalledTimes(1);
  });

  it("should fail gracefully when trying to set a non-existent stage", async () => {
    stageManager.registerStage(mockStage1);

    // Try to set a non-existent stage
    const result = await stageManager.setCurrentStage("nonexistent");

    // Should return false to indicate failure
    expect(result).toBe(false);

    // Current stage should not change
    expect(stageManager.getCurrentStage()).toBeUndefined();
  });

  it("should create stages from config objects", () => {
    const config: StageConfig = {
      stageId: "config_stage",
      stageName: "Config Stage",
      description: "Created from config",
      layers: [],
      boundaries: { left: 100, right: 1180, floor: 500 },
    };

    // Create a stage from config
    const createdStage = stageManager.createStage(config);

    // Verify stage was created with correct properties
    expect(createdStage).toBeInstanceOf(Stage);
    expect(createdStage.getId()).toBe("config_stage");
    expect(createdStage.getName()).toBe("Config Stage");
    expect(createdStage.getDescription()).toBe("Created from config");
  });

  it("should load stages from configuration", async () => {
    // Mock the stage loading functionality
    vi.spyOn(stageManager as any, "loadStageConfigs").mockResolvedValue([
      {
        stageId: "dojo",
        stageName: "Dojo",
        description: "Training dojo",
        layers: [],
        boundaries: { left: 100, right: 1180, floor: 500 },
      },
      {
        stageId: "street",
        stageName: "Street",
        description: "Urban street",
        layers: [],
        boundaries: { left: 100, right: 1180, floor: 500 },
      },
    ]);

    // Call loadStages
    await stageManager.loadStages();

    // Verify stages were registered
    expect(stageManager.getAllStages().length).toBe(2);
    expect(stageManager.hasStage("dojo")).toBe(true);
    expect(stageManager.hasStage("street")).toBe(true);
  });
});
