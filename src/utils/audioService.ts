/**
 * Audio service for the 2D fighting game
 * Provides a centralized way to manage game audio using Howler.js
 */
import { Howl, Howler } from "howler";

interface AudioOptions {
  volume?: number;
  loop?: boolean;
  rate?: number; // Playback rate (1.0 = normal)
  sprite?: Record<string, [number, number]>; // For sprite sheets [start, duration]
}

/**
 * Map of loaded sound effects and music
 */
const audioCache: Map<string, Howl> = new Map();

/**
 * Create a Howl instance (extracted for testability)
 */
export const createHowl = (
  src: string | string[],
  options: AudioOptions = {}
): Howl => {
  return new Howl({
    src: Array.isArray(src) ? src : [src],
    volume: options.volume ?? 1.0,
    loop: options.loop ?? false,
    rate: options.rate ?? 1.0,
    sprite: options.sprite,
  });
};

/**
 * Load an audio file and cache it for later use
 * @param id Unique identifier for the sound
 * @param src Source URL of the audio file
 * @param options Audio configuration options
 */
export const loadAudio = (
  id: string,
  src: string | string[],
  options: AudioOptions = {}
): Promise<Howl> => {
  // Return from cache if already loaded
  if (audioCache.has(id)) {
    return Promise.resolve(audioCache.get(id)!);
  }

  // Create a new Howl instance
  return new Promise((resolve, reject) => {
    try {
      const sound = new Howl({
        src: Array.isArray(src) ? src : [src],
        volume: options.volume ?? 1.0,
        loop: options.loop ?? false,
        rate: options.rate ?? 1.0,
        sprite: options.sprite,
        onload: () => {
          audioCache.set(id, sound);
          resolve(sound);
        },
        onloaderror: (_id: any, error: any) => {
          reject(new Error(`Failed to load audio ${id}: ${error}`));
        },
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Play a sound by its identifier
 * @param id The unique identifier of the sound to play
 * @param sprite Optional sprite name if using sprite sheet
 * @returns The sound ID that can be used to control playback
 */
export const playSound = (id: string, sprite?: string): number => {
  const sound = audioCache.get(id);

  if (!sound) {
    console.warn(`Attempted to play sound "${id}" but it's not loaded.`);
    return -1;
  }

  return sprite ? sound.play(sprite) : sound.play();
};

/**
 * Stop a specific sound or sprite
 * @param id The unique identifier of the sound to stop
 * @param soundId Optional specific sound ID to stop (if same sound played multiple times)
 */
export const stopSound = (id: string, soundId?: number): void => {
  const sound = audioCache.get(id);

  if (!sound) {
    return;
  }

  if (soundId !== undefined) {
    sound.stop(soundId);
  } else {
    sound.stop();
  }
};

/**
 * Set the volume for a specific sound
 * @param id The unique identifier of the sound
 * @param volume Volume level from 0.0 to 1.0
 * @param soundId Optional specific sound ID to adjust
 */
export const setVolume = (
  id: string,
  volume: number,
  soundId?: number
): void => {
  const sound = audioCache.get(id);

  if (!sound) {
    return;
  }

  if (soundId !== undefined) {
    sound.volume(volume, soundId);
  } else {
    sound.volume(volume);
  }
};

/**
 * Set the global volume for all sounds
 * @param volume Volume level from 0.0 to 1.0
 */
export const setGlobalVolume = (volume: number): void => {
  Howler.volume(volume);
};

/**
 * Pause a specific sound
 * @param id The unique identifier of the sound
 * @param soundId Optional specific sound ID to pause
 */
export const pauseSound = (id: string, soundId?: number): void => {
  const sound = audioCache.get(id);

  if (!sound) {
    return;
  }

  if (soundId !== undefined) {
    sound.pause(soundId);
  } else {
    sound.pause();
  }
};

/**
 * Resume a paused sound
 * @param id The unique identifier of the sound
 * @param soundId Optional specific sound ID to resume
 */
export const resumeSound = (id: string, soundId?: number): void => {
  const sound = audioCache.get(id);

  if (!sound) {
    return;
  }

  if (soundId !== undefined) {
    sound.play(soundId);
  } else {
    sound.play();
  }
};

/**
 * Unload and remove a sound from the cache
 * @param id The unique identifier of the sound to remove
 */
export const unloadSound = (id: string): void => {
  const sound = audioCache.get(id);

  if (sound) {
    sound.unload();
    audioCache.delete(id);
  }
};

/**
 * Get a loaded Howl instance by ID
 * @param id The unique identifier of the sound
 * @returns The Howl instance or undefined if not found
 */
export const getSound = (id: string): Howl | undefined => {
  return audioCache.get(id);
};

/**
 * Check if audio with specified ID is loaded
 * @param id The unique identifier of the sound
 * @returns True if the audio is loaded and ready
 */
export const isLoaded = (id: string): boolean => {
  const sound = audioCache.get(id);
  return sound ? sound.state() === "loaded" : false;
};

/**
 * Mute or unmute all audio
 * @param muted Whether to mute (true) or unmute (false) audio
 */
export const setMute = (muted: boolean): void => {
  Howler.mute(muted);
};

/**
 * Clear all audio from cache and stop all sounds
 * Primarily used for testing
 */
export const clearAudioCache = (): void => {
  audioCache.forEach((sound) => sound.unload());
  audioCache.clear();
};
