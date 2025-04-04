/**
 * Stage.spec.ts
 * Tests for the base Stage class implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Stage } from "./Stage";
import { StageConfig, StageBoundaries, StageLayer } from "./interface/IStage";
import { Vector2D } from "../engine/physics/CollisionSystem";
import * as audioService from "../utils/audioService";

// Mock the audio service
vi.mock("../utils/audioService", () => ({
  playSound: vi.fn(),
  stopSound: vi.fn(),
  playMusic: vi.fn(),
  stopMusic: vi.fn(),
}));

// Mock the asset loader
vi.mock("../utils/assetLoader", () => ({
  loadImage: vi.fn().mockResolvedValue(new Image()),
}));

describe("Stage", () => {
  let mockConfig: StageConfig;
  let stage: Stage;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Create a mock stage config
    mockConfig = {
      stageId: "test_stage",
      stageName: "Test Stage",
      description: "A test stage for unit testing",
      layers: [
        {
          id: "background",
          imageFile: "background.png",
          position: { x: 0, y: 0 },
          dimensions: { width: 1280, height: 720 },
          parallaxFactor: 0.1,
          animated: false,
        },
        {
          id: "floor",
          imageFile: "floor.png",
          position: { x: 0, y: 500 },
          dimensions: { width: 1280, height: 220 },
          parallaxFactor: 1.0,
          animated: false,
        },
      ],
      boundaries: {
        left: 100,
        right: 1180,
        floor: 500,
      },
      audio: {
        backgroundMusic: "stage_theme.mp3",
        ambientSounds: ["ambient.mp3"],
        eventSounds: {
          roundStart: "round_start.mp3",
        },
      },
    };

    // Create the stage instance
    stage = new Stage(mockConfig);

    // Create a mock canvas context
    mockCtx = {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with the correct config values", () => {
    expect(stage.getId()).toBe("test_stage");
    expect(stage.getName()).toBe("Test Stage");
    expect(stage.getDescription()).toBe("A test stage for unit testing");
    expect(stage.getLayers().length).toBe(2);
    expect(stage.getBoundaries()).toEqual(mockConfig.boundaries);
    expect(stage.getFloorY()).toBe(500);
  });

  it("should return the correct layer when getLayer is called", () => {
    const layer = stage.getLayer("background");
    expect(layer).toBeDefined();
    expect(layer?.id).toBe("background");
    expect(layer?.parallaxFactor).toBe(0.1);
  });

  it("should return undefined when getLayer is called with an invalid ID", () => {
    const layer = stage.getLayer("nonexistent");
    expect(layer).toBeUndefined();
  });

  it("should call the audio service when playMusic is called", () => {
    stage.playMusic();
    expect(audioService.playMusic).toHaveBeenCalledWith("stage_theme.mp3");
  });

  it("should call the audio service when stopMusic is called", () => {
    stage.stopMusic();
    expect(audioService.stopMusic).toHaveBeenCalled();
  });

  it("should call the audio service when playAmbientSound is called", () => {
    stage.playAmbientSound("ambient");
    expect(audioService.playSound).toHaveBeenCalledWith("ambient.mp3");
  });

  it("should call the audio service when playEventSound is called", () => {
    stage.playEventSound("roundStart");
    expect(audioService.playSound).toHaveBeenCalledWith("round_start.mp3");
  });

  it("should not throw when playing a non-existent sound", () => {
    expect(() => {
      stage.playAmbientSound("nonexistent");
      stage.playEventSound("nonexistent");
    }).not.toThrow();
  });

  it("should render all visible layers", async () => {
    await stage.initialize(); // Normally loads images

    stage.render(mockCtx, { x: 0, y: 0 });

    // Should call drawImage for each layer (2 in our mock)
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(2);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it("should apply parallax effect when rendering with camera offset", async () => {
    await stage.initialize();

    const cameraOffset: Vector2D = { x: 100, y: 0 };
    stage.render(mockCtx, cameraOffset);

    // Background should move less than foreground due to parallax
    expect(mockCtx.translate).toHaveBeenCalledWith(-10, 0); // background has 0.1 factor
    expect(mockCtx.translate).toHaveBeenCalledWith(-100, 0); // floor has 1.0 factor
  });

  it("should update animated layers", async () => {
    // Create config with an animated layer
    const configWithAnimation: StageConfig = {
      ...mockConfig,
      layers: [
        ...mockConfig.layers,
        {
          id: "animated_element",
          imageFile: "animated.png",
          position: { x: 0, y: 0 },
          dimensions: { width: 1280, height: 720 },
          parallaxFactor: 0.5,
          animated: true,
        },
      ],
      animations: [
        {
          layerId: "animated_element",
          animationData: {
            layerId: "animated_element",
            frameWidth: 1280,
            frameHeight: 720,
            frames: 4,
            frameRate: 10,
            loop: true,
          },
        },
      ],
    };

    const animatedStage = new Stage(configWithAnimation);
    await animatedStage.initialize();

    // Update with delta time equivalent to 1 frame at 10fps
    animatedStage.update(100); // 100ms

    // Test that the animation state has been updated
    // This would normally advance the frame in the actual implementation
    const animationData = animatedStage["animations"]?.[0]?.animationData;
    expect(animationData).toBeDefined();
    // Add expectations for animation state once implemented
  });
});
