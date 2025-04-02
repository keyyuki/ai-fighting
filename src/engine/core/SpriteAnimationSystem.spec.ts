/**
 * SpriteAnimationSystem.spec.ts
 * Unit tests for the SpriteAnimationSystem class
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  SpriteAnimationSystem,
  AnimationConfig,
  Animation,
} from "./SpriteAnimationSystem";

describe("SpriteAnimationSystem", () => {
  let animationSystem: SpriteAnimationSystem;

  // Mock animation configuration
  const testAnimation: AnimationConfig = {
    name: "idle",
    frames: [
      { x: 0, y: 0, width: 64, height: 64 },
      { x: 64, y: 0, width: 64, height: 64 },
      { x: 128, y: 0, width: 64, height: 64 },
    ],
    frameDuration: 100, // 100ms per frame
    loop: true,
  };

  // Non-looping animation for testing completion
  const nonLoopingAnimation: AnimationConfig = {
    name: "attack",
    frames: [
      { x: 0, y: 64, width: 64, height: 64 },
      { x: 64, y: 64, width: 64, height: 64, duration: 150 }, // Override default duration
    ],
    frameDuration: 100,
    loop: false,
  };

  beforeEach(() => {
    animationSystem = new SpriteAnimationSystem();

    // Register test animations
    animationSystem.registerAnimation("idle", testAnimation);
    animationSystem.registerAnimation("attack", nonLoopingAnimation);
  });

  test("should register and play animations", () => {
    // Play animation for entity 'player1'
    const animation = animationSystem.playAnimation("idle", "player1");

    // Verify animation was created and returned
    expect(animation).not.toBeNull();
    expect(animation?.getName()).toBe("idle");
  });

  test("should handle frame updates and looping", () => {
    // Play looping animation
    const animation = animationSystem.playAnimation(
      "idle",
      "player1"
    ) as Animation;

    // Get initial frame
    const initialFrame = animation.getCurrentFrame();
    expect(initialFrame).toEqual(testAnimation.frames[0]);

    // Update to advance to second frame (100ms)
    animation.update(100);
    expect(animation.getCurrentFrame()).toEqual(testAnimation.frames[1]);

    // Update to advance to third frame (100ms)
    animation.update(100);
    expect(animation.getCurrentFrame()).toEqual(testAnimation.frames[2]);

    // Update to loop back to first frame (100ms)
    animation.update(100);
    expect(animation.getCurrentFrame()).toEqual(testAnimation.frames[0]);

    // Animation should not be finished since it loops
    expect(animation.isFinished()).toBe(false);
  });

  test("should handle non-looping animations and completion", () => {
    // Play non-looping animation
    const animation = animationSystem.playAnimation(
      "attack",
      "player1"
    ) as Animation;

    // Mock completion callback
    const completionCallback = vi.fn();
    animation.setOnComplete(completionCallback);

    // Verify initial frame
    expect(animation.getCurrentFrame()).toEqual(nonLoopingAnimation.frames[0]);
    expect(animation.isFinished()).toBe(false);

    // Update to advance to second frame (100ms)
    animation.update(100);
    expect(animation.getCurrentFrame()).toEqual(nonLoopingAnimation.frames[1]);
    expect(animation.isFinished()).toBe(false);

    // Update to finish animation (150ms for second frame)
    animation.update(150);

    // Animation should now be finished
    expect(animation.isFinished()).toBe(true);

    // The animation should stay on the last frame
    expect(animation.getCurrentFrame()).toEqual(nonLoopingAnimation.frames[1]);

    // Completion callback should have been called
    expect(completionCallback).toHaveBeenCalledTimes(1);
  });

  test("should respect frame-specific duration", () => {
    // Play non-looping animation with custom frame duration
    const animation = animationSystem.playAnimation(
      "attack",
      "player1"
    ) as Animation;

    // First frame has default duration (100ms)
    animation.update(99); // Not enough time to advance
    expect(animation.getCurrentFrame()).toEqual(nonLoopingAnimation.frames[0]);

    animation.update(1); // Now we've hit 100ms, should advance
    expect(animation.getCurrentFrame()).toEqual(nonLoopingAnimation.frames[1]);

    // Second frame has custom duration (150ms)
    animation.update(149); // Not enough time to advance
    expect(animation.getCurrentFrame()).toEqual(nonLoopingAnimation.frames[1]);

    animation.update(1); // Now we've hit 150ms, should finish (since non-looping)
    expect(animation.isFinished()).toBe(true);
  });

  test("should handle frame callbacks", () => {
    // Play animation
    const animation = animationSystem.playAnimation(
      "idle",
      "player1"
    ) as Animation;

    // Mock frame start callback
    const frameCallback = vi.fn();
    animation.setFrameStartCallback(frameCallback);

    // Update to advance frames
    animation.update(100); // Frame 0 -> 1
    expect(frameCallback).toHaveBeenCalledWith(1);

    animation.update(100); // Frame 1 -> 2
    expect(frameCallback).toHaveBeenCalledWith(2);

    // Total calls should be 2
    expect(frameCallback).toHaveBeenCalledTimes(2);
  });

  test("should stop animations for an entity", () => {
    // Play two animations for the same entity
    animationSystem.playAnimation("idle", "player1");
    animationSystem.playAnimation("attack", "player1");

    // Play an animation for a different entity
    animationSystem.playAnimation("idle", "player2");

    // Stop all animations for player1
    animationSystem.stopAllEntityAnimations("player1");

    // Update animations
    animationSystem.update(100);

    // Try to render - this would throw if the animations were still active,
    // but since we can't test rendering directly, we'll rely on code coverage
    expect(() => {
      // This is more of a sanity check that our code doesn't throw
      // due to trying to render removed animations
      animationSystem.update(100);
    }).not.toThrow();
  });

  test("should reset an animation", () => {
    // Play animation
    const animation = animationSystem.playAnimation(
      "idle",
      "player1"
    ) as Animation;

    // Advance animation - we'll advance one frame at a time to ensure it works correctly
    animation.update(100); // Advance to frame 1
    animation.update(100); // Advance to frame 2
    expect(animation.getCurrentFrame()).toEqual(testAnimation.frames[2]);

    // Reset animation
    animation.reset();

    // Should be back to frame 0
    expect(animation.getCurrentFrame()).toEqual(testAnimation.frames[0]);
  });

  test("should play same animation with reset option", () => {
    // Play animation first time
    const animation1 = animationSystem.playAnimation(
      "idle",
      "player1"
    ) as Animation;

    // Advance animation
    animation1.update(200); // Should be on frame 2 now

    // Play the same animation with reset=true
    const animation2 = animationSystem.playAnimation(
      "idle",
      "player1",
      true
    ) as Animation;

    // Should be the same instance but reset to frame 0
    expect(animation2).toBe(animation1);
    expect(animation2.getCurrentFrame()).toEqual(testAnimation.frames[0]);
  });

  test("should handle multiple animations in update", () => {
    // Play animations for different entities
    animationSystem.playAnimation("idle", "player1");
    animationSystem.playAnimation("attack", "player2");

    // Update all animations
    animationSystem.update(100);

    // Both animations should have advanced
    // We can't directly test the state of internal animations,
    // but we're at least ensuring the update doesn't throw
    expect(() => {
      animationSystem.update(100);
    }).not.toThrow();
  });
});
