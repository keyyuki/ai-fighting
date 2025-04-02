/**
 * Asset loader utility for the 2D fighting game
 * Handles loading and caching of various game assets (images, audio, etc.)
 */

// Asset cache to prevent reloading the same assets
const imageCache: Map<string, HTMLImageElement> = new Map();
const audioCache: Map<string, HTMLAudioElement> = new Map();

/**
 * Load an image and cache it
 * @param src - The source path of the image
 * @returns A promise that resolves with the loaded image
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  // Check if image is already cached
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }

  // Load and cache the image
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Load multiple images and cache them
 * @param sources - Array of image source paths
 * @returns A promise that resolves when all images are loaded
 */
export const loadImages = (sources: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(sources.map((src) => loadImage(src)));
};

/**
 * Load an audio file and cache it
 * @param src - The source path of the audio file
 * @returns A promise that resolves with the loaded audio
 */
export const loadAudio = (src: string): Promise<HTMLAudioElement> => {
  // Check if audio is already cached
  if (audioCache.has(src)) {
    return Promise.resolve(audioCache.get(src)!);
  }

  // Load and cache the audio
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.oncanplaythrough = () => {
      audioCache.set(src, audio);
      resolve(audio);
    };
    audio.onerror = () => reject(new Error(`Failed to load audio: ${src}`));
    audio.src = src;
  });
};

/**
 * Load multiple audio files and cache them
 * @param sources - Array of audio source paths
 * @returns A promise that resolves when all audio files are loaded
 */
export const loadAudios = (sources: string[]): Promise<HTMLAudioElement[]> => {
  return Promise.all(sources.map((src) => loadAudio(src)));
};

/**
 * Preload a set of assets for a specific game entity (character, stage, etc.)
 * @param config - Configuration object with paths to required assets
 */
export const preloadAssets = async (config: {
  images?: string[];
  audio?: string[];
}): Promise<void> => {
  const promises: Promise<any>[] = [];

  if (config.images && config.images.length > 0) {
    promises.push(loadImages(config.images));
  }

  if (config.audio && config.audio.length > 0) {
    promises.push(loadAudios(config.audio));
  }

  await Promise.all(promises);
};

/**
 * Clear all cached assets
 * Useful when transitioning between game states to free memory
 */
export const clearAssetCache = (): void => {
  imageCache.clear();
  audioCache.clear();
};
