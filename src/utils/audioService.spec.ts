/**
 * Unit tests for the audio service
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Howler.js directly
vi.mock("howler", () => {
  // Create a function that generates a mock Howl instance
  const createMockHowl = (options: any) => {
    const mockHowl = {
      play: vi.fn().mockReturnValue(123),
      stop: vi.fn(),
      pause: vi.fn(),
      volume: vi.fn(),
      state: vi.fn().mockReturnValue("loaded"),
      unload: vi.fn(),
    };

    // Call onload callback immediately if provided
    if (options.onload) {
      setTimeout(() => options.onload(), 0);
    }

    return mockHowl;
  };

  return {
    Howl: vi.fn().mockImplementation((options) => createMockHowl(options)),
    Howler: {
      volume: vi.fn(),
      mute: vi.fn(),
    },
  };
});

// Import after mock setup
import { Howl, Howler } from "howler";
import * as audioService from "./audioService";

describe("Audio Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    audioService.clearAudioCache();
  });

  describe("loadAudio", () => {
    it("should load an audio file", async () => {
      const sound = await audioService.loadAudio("test-sound", "test.mp3");

      expect(Howl).toHaveBeenCalledWith(
        expect.objectContaining({
          src: ["test.mp3"],
        })
      );
      expect(sound).toBeDefined();
    });

    it("should return cached audio if already loaded", async () => {
      // First load
      const sound1 = await audioService.loadAudio("cached-sound", "cached.mp3");

      // Reset mock counts
      vi.mocked(Howl).mockClear();

      // Second load should use cache
      const sound2 = await audioService.loadAudio("cached-sound", "cached.mp3");

      expect(sound1).toBe(sound2);
      expect(Howl).not.toHaveBeenCalled();
    });

    it("should support options when loading audio", async () => {
      const options = {
        volume: 0.5,
        loop: true,
        rate: 1.5,
        sprite: { intro: [0, 3000] },
      };

      await audioService.loadAudio("options-test", "options.mp3", options);

      expect(Howl).toHaveBeenCalledWith(
        expect.objectContaining({
          volume: 0.5,
          loop: true,
          rate: 1.5,
          sprite: { intro: [0, 3000] },
        })
      );
    });
  });

  describe("playSound", () => {
    it("should play a sound", async () => {
      const sound = await audioService.loadAudio("play-test", "play.mp3");
      const soundId = audioService.playSound("play-test");

      expect(sound.play).toHaveBeenCalled();
      expect(soundId).toBe(123);
    });

    it("should play a sprite", async () => {
      const sound = await audioService.loadAudio("sprite-test", "sprite.mp3", {
        sprite: { hit: [0, 1000], jump: [1000, 1000] },
      });

      audioService.playSound("sprite-test", "hit");

      expect(sound.play).toHaveBeenCalledWith("hit");
    });

    it("should warn when playing non-loaded sound", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = audioService.playSound("non-existent");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("non-existent")
      );
      expect(result).toBe(-1);

      consoleSpy.mockRestore();
    });
  });

  describe("Audio control functions", () => {
    it("should stop a sound", async () => {
      const sound = await audioService.loadAudio("stop-test", "stop.mp3");
      audioService.stopSound("stop-test");

      expect(sound.stop).toHaveBeenCalled();
    });

    it("should set volume for a sound", async () => {
      const sound = await audioService.loadAudio("volume-test", "volume.mp3");
      audioService.setVolume("volume-test", 0.7);

      expect(sound.volume).toHaveBeenCalledWith(0.7);
    });

    it("should set volume for a specific sound instance", async () => {
      const sound = await audioService.loadAudio(
        "volume-instance-test",
        "volume.mp3"
      );
      audioService.setVolume("volume-instance-test", 0.8, 2);

      expect(sound.volume).toHaveBeenCalledWith(0.8, 2);
    });

    it("should set global volume", () => {
      audioService.setGlobalVolume(0.5);
      expect(Howler.volume).toHaveBeenCalledWith(0.5);
    });

    it("should pause a sound", async () => {
      const sound = await audioService.loadAudio("pause-test", "pause.mp3");
      audioService.pauseSound("pause-test");

      expect(sound.pause).toHaveBeenCalled();
    });

    it("should resume a sound", async () => {
      const sound = await audioService.loadAudio("resume-test", "resume.mp3");
      audioService.resumeSound("resume-test");

      expect(sound.play).toHaveBeenCalled();
    });

    it("should unload a sound", async () => {
      const sound = await audioService.loadAudio("unload-test", "unload.mp3");
      audioService.unloadSound("unload-test");

      expect(sound.unload).toHaveBeenCalled();
      expect(audioService.getSound("unload-test")).toBeUndefined();
    });

    it("should check if audio is loaded", async () => {
      await audioService.loadAudio("loaded-check", "loaded.mp3");

      expect(audioService.isLoaded("loaded-check")).toBe(true);
      expect(audioService.isLoaded("not-loaded-check")).toBe(false);
    });

    it("should set mute state", () => {
      audioService.setMute(true);
      expect(Howler.mute).toHaveBeenCalledWith(true);
    });

    it("should handle non-existent sounds gracefully", () => {
      // None of these should throw errors
      audioService.stopSound("non-existent");
      audioService.pauseSound("non-existent");
      audioService.resumeSound("non-existent");
      audioService.setVolume("non-existent", 0.5);
      audioService.unloadSound("non-existent");

      expect(audioService.getSound("non-existent")).toBeUndefined();
      expect(audioService.isLoaded("non-existent")).toBe(false);
    });
  });
});
