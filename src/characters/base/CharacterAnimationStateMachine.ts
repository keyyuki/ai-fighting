/**
 * CharacterAnimationStateMachine.ts
 * Handles state-based animations and transitions for fighting game characters
 */

import {
  SpriteAnimationSystem,
  Animation,
  AnimationConfig,
} from "../../engine/core/SpriteAnimationSystem";
import { CharacterState } from "./Character";

/**
 * Defines a transition between animation states
 */
export interface AnimationStateTransition {
  /**
   * The state to transition to
   */
  toState: CharacterState;

  /**
   * Condition that must be true for the transition to occur
   * Returns true if transition should happen
   */
  condition: () => boolean;

  /**
   * Priority of this transition (higher numbers take precedence)
   */
  priority: number;
}

/**
 * Configuration for an animation state
 */
export interface AnimationStateConfig {
  /**
   * ID of the animation to play
   */
  animationId: string;

  /**
   * Whether this animation can be interrupted
   */
  interruptible: boolean;

  /**
   * Optional callback when entering this state
   */
  onEnter?: () => void;

  /**
   * Optional callback when exiting this state
   */
  onExit?: () => void;

  /**
   * Optional callback when the animation completes (useful for non-looping animations)
   */
  onComplete?: () => void;
}

/**
 * Manages character animations and state transitions
 */
export class CharacterAnimationStateMachine {
  /**
   * Current character state
   */
  private currentState: CharacterState;

  /**
   * Previous character state
   */
  private previousState: CharacterState;

  /**
   * Reference to animation system
   */
  private animationSystem: SpriteAnimationSystem;

  /**
   * Entity ID for this character's animations
   */
  private entityId: string;

  /**
   * Current active animation
   */
  private currentAnimation: Animation | null = null;

  /**
   * Mapping of states to animation configurations
   */
  private stateAnimations: Map<CharacterState, AnimationStateConfig> =
    new Map();

  /**
   * Transitions from each state
   */
  private stateTransitions: Map<CharacterState, AnimationStateTransition[]> =
    new Map();

  /**
   * Whether the current state is locked (can't be interrupted)
   */
  private stateLocked: boolean = false;

  /**
   * Create a new animation state machine
   * @param initialState Initial character state
   * @param entityId Entity ID for animation tracking
   * @param animationSystem Reference to the game's animation system
   */
  constructor(
    initialState: CharacterState,
    entityId: string,
    animationSystem: SpriteAnimationSystem
  ) {
    this.currentState = initialState;
    this.previousState = initialState;
    this.entityId = entityId;
    this.animationSystem = animationSystem;
  }

  /**
   * Register an animation for a specific state
   * @param state The character state
   * @param config Animation state configuration
   */
  public registerAnimation(
    state: CharacterState,
    config: AnimationStateConfig
  ): void {
    this.stateAnimations.set(state, config);
  }

  /**
   * Register multiple animations at once
   * @param animations Map of states to animation configurations
   */
  public registerAnimations(
    animations: Map<CharacterState, AnimationStateConfig>
  ): void {
    animations.forEach((config, state) => {
      this.registerAnimation(state, config);
    });
  }

  /**
   * Add a transition between states
   * @param fromState State to transition from
   * @param transition Transition configuration
   */
  public addTransition(
    fromState: CharacterState,
    transition: AnimationStateTransition
  ): void {
    if (!this.stateTransitions.has(fromState)) {
      this.stateTransitions.set(fromState, []);
    }

    const transitions = this.stateTransitions.get(fromState)!;

    // Add the new transition, keeping the array sorted by priority (descending)
    transitions.push(transition);
    transitions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Force a state change regardless of current state or transitions
   * @param newState The state to change to
   * @returns True if state was changed successfully
   */
  public forceState(newState: CharacterState): boolean {
    const config = this.stateAnimations.get(newState);
    if (!config) return false;

    // Exit current state if needed
    const currentConfig = this.stateAnimations.get(this.currentState);
    if (currentConfig?.onExit) {
      currentConfig.onExit();
    }

    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateLocked = !config.interruptible;

    // Play the new animation
    this.currentAnimation = this.animationSystem.playAnimation(
      config.animationId,
      this.entityId,
      true // Reset animation
    );

    // If this animation has a completion callback, set it
    if (this.currentAnimation && config.onComplete) {
      this.currentAnimation.setOnComplete(config.onComplete);
    }

    // Call enter callback if provided
    if (config.onEnter) {
      config.onEnter();
    }

    return true;
  }

  /**
   * Update the animation state machine
   * @returns The current character state
   */
  public update(): CharacterState {
    // Check for possible transitions
    this.checkTransitions();

    return this.currentState;
  }

  /**
   * Check if any transitions should be triggered from the current state
   */
  private checkTransitions(): void {
    // If state is locked, don't check for transitions
    if (this.stateLocked) {
      // Exception: if animation is finished, unlock the state
      if (this.currentAnimation?.isFinished()) {
        this.stateLocked = false;
      } else {
        return;
      }
    }

    // Get transitions for current state
    const transitions = this.stateTransitions.get(this.currentState);
    if (!transitions) return;

    // Check each transition in priority order
    for (const transition of transitions) {
      if (transition.condition()) {
        this.forceState(transition.toState);
        return;
      }
    }
  }

  /**
   * Get the current character state
   */
  public getCurrentState(): CharacterState {
    return this.currentState;
  }

  /**
   * Get the previous character state
   */
  public getPreviousState(): CharacterState {
    return this.previousState;
  }

  /**
   * Get the current animation
   */
  public getCurrentAnimation(): Animation | null {
    return this.currentAnimation;
  }

  /**
   * Check if the current state can be interrupted
   */
  public canBeInterrupted(): boolean {
    return !this.stateLocked;
  }

  /**
   * Get animation ID for the current state
   */
  public getCurrentAnimationId(): string | null {
    const config = this.stateAnimations.get(this.currentState);
    return config ? config.animationId : null;
  }

  /**
   * Unlock the current state, allowing transitions
   */
  public unlockState(): void {
    this.stateLocked = false;
  }
}
