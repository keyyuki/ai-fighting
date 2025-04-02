/**
 * Unit tests for the asset loader utility
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadImage,
  loadImages,
  loadAudio,
  loadAudios,
  preloadAssets,
  clearAssetCache,
} from "./assetLoader";

// Mock the global Image constructor
vi.stubGlobal(
  "Image",
  class {
    onload: () => void = () => {};
    onerror: () => void = () => {};
    src: string = "";

    constructor() {
      setTimeout(() => this.onload(), 0);
    }
  }
);

// Mock the global Audio constructor
vi.stubGlobal(
  "Audio",
  class {
    oncanplaythrough: () => void = () => {};
    onerror: () => void = () => {};
    src: string = "";

    constructor() {
      setTimeout(() => this.oncanplaythrough(), 0);
    }
  }
);

describe("Asset Loader", () => {
  beforeEach(() => {
    clearAssetCache();
  });

  describe("loadImage", () => {
    it("should load an image and resolve with the image element", async () => {
      const image = await loadImage("test.png");
      expect(image).toBeDefined();
      expect(image.src.endsWith("test.png")).toBe(true);
    });

    it("should return cached image on subsequent calls", async () => {
      const image1 = await loadImage("cached.png");
      const image2 = await loadImage("cached.png");
      expect(image1).toBe(image2);
    });
  });

  describe("loadImages", () => {
    it("should load multiple images", async () => {
      const sources = ["test1.png", "test2.png", "test3.png"];
      const images = await loadImages(sources);
      expect(images).toHaveLength(3);
      expect(images[0].src.endsWith("test1.png")).toBe(true);
      expect(images[1].src.endsWith("test2.png")).toBe(true);
      expect(images[2].src.endsWith("test3.png")).toBe(true);
    });
  });

  describe("loadAudio", () => {
    it("should load audio and resolve with the audio element", async () => {
      const audio = await loadAudio("test.mp3");
      expect(audio).toBeDefined();
      expect(audio.src.endsWith("test.mp3")).toBe(true);
    });

    it("should return cached audio on subsequent calls", async () => {
      const audio1 = await loadAudio("cached.mp3");
      const audio2 = await loadAudio("cached.mp3");
      expect(audio1).toBe(audio2);
    });
  });

  describe("loadAudios", () => {
    it("should load multiple audio files", async () => {
      const sources = ["test1.mp3", "test2.mp3", "test3.mp3"];
      const audioFiles = await loadAudios(sources);
      expect(audioFiles).toHaveLength(3);
      expect(audioFiles[0].src.endsWith("test1.mp3")).toBe(true);
      expect(audioFiles[1].src.endsWith("test2.mp3")).toBe(true);
      expect(audioFiles[2].src.endsWith("test3.mp3")).toBe(true);
    });
  });

  describe("preloadAssets", () => {
    it("should preload both image and audio assets", async () => {
      await preloadAssets({
        images: ["preload1.png", "preload2.png"],
        audio: ["preload1.mp3", "preload2.mp3"],
      });

      // Verify images were loaded by loading them again (should use cache)
      const image1 = await loadImage("preload1.png");
      const image2 = await loadImage("preload2.png");
      expect(image1.src.endsWith("preload1.png")).toBe(true);
      expect(image2.src.endsWith("preload2.png")).toBe(true);

      // Verify audio files were loaded by loading them again (should use cache)
      const audio1 = await loadAudio("preload1.mp3");
      const audio2 = await loadAudio("preload2.mp3");
      expect(audio1.src.endsWith("preload1.mp3")).toBe(true);
      expect(audio2.src.endsWith("preload2.mp3")).toBe(true);
    });

    it("should handle empty asset lists", async () => {
      await expect(preloadAssets({})).resolves.toBeUndefined();
    });
  });
});
