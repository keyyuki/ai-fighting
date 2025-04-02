/**
 * CharacterPhysics.ts
 * Handles the physics calculations for fighting game characters
 */

import { Vector2D } from "../../engine/physics/CollisionSystem";
import { Character, CharacterState } from "./Character";

/**
 * Physics constants for character movement
 */
export interface PhysicsConfig {
  /**
   * Gravity applied per frame
   */
  gravity: number;

  /**
   * Maximum fall speed
   */
  terminalVelocity: number;

  /**
   * Ground friction (higher values slow characters faster)
   */
  groundFriction: number;

  /**
   * Air friction (usually lower than ground friction)
   */
  airFriction: number;

  /**
   * Ground Y position (the "floor")
   */
  groundY: number;

  /**
   * Jump force (negative for upward movement)
   */
  jumpForce: number;

  /**
   * Max walk speed
   */
  walkSpeed: number;

  /**
   * Max dash speed
   */
  dashSpeed: number;

  /**
   * Maximum air control (horizontal movement while in air)
   */
  airControl: number;

  /**
   * Knockback resistance (higher values reduce knockback)
   */
  knockbackResistance: number;
}

/**
 * Manages physics calculations for a character
 */
export class CharacterPhysics {
  /**
   * The character this system controls
   */
  private character: Character;

  /**
   * Physics configuration
   */
  private config: PhysicsConfig;

  /**
   * Current position
   */
  private position: Vector2D;

  /**
   * Current velocity
   */
  private velocity: Vector2D;

  /**
   * Current acceleration
   */
  private acceleration: Vector2D;

  /**
   * Whether the character is on the ground
   */
  private isGrounded: boolean;

  /**
   * Callback for when the character lands on the ground
   */
  private onLandCallback: (() => void) | null = null;

  /**
   * Callback for when the character leaves the ground
   */
  private onLeaveGroundCallback: (() => void) | null = null;

  /**
   * Create a new CharacterPhysics instance
   * @param character The character this system controls
   * @param initialPosition Starting position
   * @param config Physics configuration
   */
  constructor(
    character: Character,
    initialPosition: Vector2D,
    config: PhysicsConfig
  ) {
    this.character = character;
    this.config = config;
    this.position = { ...initialPosition };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.isGrounded = this.position.y >= config.groundY;
  }

  /**
   * Update physics calculations
   * @param deltaTime Time since last frame in milliseconds
   * @param state Current character state
   */
  public update(deltaTime: number, state: CharacterState): void {
    // Convert milliseconds to seconds for physics calculations
    const dt = deltaTime / 1000;

    // Calculate acceleration based on state
    this.calculateAcceleration(state);

    // Apply acceleration to velocity
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y * dt;

    // Apply friction based on ground/air state
    this.applyFriction(dt);

    // Clamp velocity to limits
    this.clampVelocity();

    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // Check ground collision
    this.checkGroundCollision();
  }

  /**
   * Calculate acceleration based on character state
   * @param state Current character state
   */
  private calculateAcceleration(state: CharacterState): void {
    // Reset acceleration
    this.acceleration.x = 0;

    // Always apply gravity when not on ground
    if (!this.isGrounded) {
      this.acceleration.y = this.config.gravity;
    } else {
      this.acceleration.y = 0;
    }

    // Handle state-specific physics
    switch (state) {
      case CharacterState.WALK_FORWARD:
        // Direction is handled by character facing
        this.velocity.x =
          this.config.walkSpeed *
          (this.character.getFacingDirection() > 0 ? 1 : -1);
        break;

      case CharacterState.WALK_BACKWARD:
        // Direction is opposite of facing
        this.velocity.x =
          -this.config.walkSpeed *
          (this.character.getFacingDirection() > 0 ? 1 : -1);
        break;

      case CharacterState.JUMP_START:
      case CharacterState.JUMP_UP:
      case CharacterState.FALLING:
        // Allow some air control (limited horizontal movement while in air)
        if (this.character.getHorizontalInput() !== 0) {
          // Calculate air movement (more limited than ground movement)
          const airMove =
            this.character.getHorizontalInput() * this.config.airControl;
          this.velocity.x = airMove;
        }
        break;

      case CharacterState.HITSTUN:
      case CharacterState.BLOCKSTUN:
        // No player control during stun states
        break;
    }
  }

  /**
   * Apply friction to velocity
   * @param dt Delta time in seconds
   */
  private applyFriction(dt: number): void {
    if (this.isGrounded) {
      // Ground friction
      this.velocity.x *= Math.pow(this.config.groundFriction, dt * 60); // Scale with framerate

      // Stop completely at very low speeds (prevents sliding)
      if (Math.abs(this.velocity.x) < 0.1) {
        this.velocity.x = 0;
      }
    } else {
      // Air friction
      this.velocity.x *= Math.pow(this.config.airFriction, dt * 60); // Scale with framerate
    }
  }

  /**
   * Clamp velocity to maximum values
   */
  private clampVelocity(): void {
    // Clamp falling speed to terminal velocity
    if (this.velocity.y > this.config.terminalVelocity) {
      this.velocity.y = this.config.terminalVelocity;
    }

    // Clamp horizontal speed based on ground/air state
    const maxHorizontalSpeed = this.isGrounded
      ? this.config.dashSpeed
      : this.config.airControl;
    if (Math.abs(this.velocity.x) > maxHorizontalSpeed) {
      this.velocity.x = Math.sign(this.velocity.x) * maxHorizontalSpeed;
    }
  }

  /**
   * Check for collision with the ground
   */
  private checkGroundCollision(): void {
    const wasGrounded = this.isGrounded;

    // Check if we've hit the ground
    if (this.position.y >= this.config.groundY) {
      this.position.y = this.config.groundY;

      // Only set grounded to true if we were falling
      if (this.velocity.y > 0) {
        this.isGrounded = true;
        this.velocity.y = 0;

        // Call the land callback if we just landed
        if (!wasGrounded && this.onLandCallback) {
          this.onLandCallback();
        }
      }
    } else {
      // We're in the air
      this.isGrounded = false;

      // Call the leave ground callback if we just left the ground
      if (wasGrounded && this.onLeaveGroundCallback) {
        this.onLeaveGroundCallback();
      }
    }
  }

  /**
   * Apply an immediate jump force
   */
  public jump(): void {
    if (!this.isGrounded) return;

    this.velocity.y = this.config.jumpForce; // Negative to jump up
    this.isGrounded = false;

    // Call the leave ground callback
    if (this.onLeaveGroundCallback) {
      this.onLeaveGroundCallback();
    }
  }

  /**
   * Apply a force to the character (for knockback, etc.)
   * @param forceX Horizontal force
   * @param forceY Vertical force
   */
  public applyForce(forceX: number, forceY: number): void {
    // Apply knockback resistance to horizontal force
    const resistedForceX =
      forceX * (1 - Math.min(this.config.knockbackResistance, 0.9));

    this.velocity.x += resistedForceX;
    this.velocity.y += forceY;

    // Being knocked into the air
    if (forceY < 0 && this.isGrounded) {
      this.isGrounded = false;

      // Call the leave ground callback
      if (this.onLeaveGroundCallback) {
        this.onLeaveGroundCallback();
      }
    }
  }

  /**
   * Set the character's velocity directly
   * @param velocityX Horizontal velocity
   * @param velocityY Vertical velocity
   */
  public setVelocity(velocityX: number, velocityY: number): void {
    this.velocity.x = velocityX;
    this.velocity.y = velocityY;

    // Being knocked into the air
    if (velocityY < 0 && this.isGrounded) {
      this.isGrounded = false;

      // Call the leave ground callback
      if (this.onLeaveGroundCallback) {
        this.onLeaveGroundCallback();
      }
    }
  }

  /**
   * Get the current position
   */
  public getPosition(): Vector2D {
    return { ...this.position };
  }

  /**
   * Set the position directly
   * @param position New position
   */
  public setPosition(position: Vector2D): void {
    this.position = { ...position };

    // Check ground state after position change
    const wasGrounded = this.isGrounded;
    this.isGrounded = this.position.y >= this.config.groundY;

    // Call relevant callbacks if ground state changed
    if (this.isGrounded && !wasGrounded) {
      if (this.onLandCallback) this.onLandCallback();
    } else if (!this.isGrounded && wasGrounded) {
      if (this.onLeaveGroundCallback) this.onLeaveGroundCallback();
    }
  }

  /**
   * Get the current velocity
   */
  public getVelocity(): Vector2D {
    return { ...this.velocity };
  }

  /**
   * Set callback for when character lands on ground
   * @param callback Function to call when landing
   */
  public setOnLandCallback(callback: () => void): void {
    this.onLandCallback = callback;
  }

  /**
   * Set callback for when character leaves the ground
   * @param callback Function to call when leaving ground
   */
  public setOnLeaveGroundCallback(callback: () => void): void {
    this.onLeaveGroundCallback = callback;
  }

  /**
   * Check if the character is on the ground
   */
  public isOnGround(): boolean {
    return this.isGrounded;
  }

  /**
   * Update the physics configuration
   * @param config New physics configuration (partial or complete)
   */
  public updateConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Stop all movement immediately
   */
  public stop(): void {
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.acceleration.x = 0;
    this.acceleration.y = 0;
  }
}
