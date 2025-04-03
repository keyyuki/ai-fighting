/**
 * Character.ts
 * Base character class for the fighting game
 * Handles character state, physics, animations, and combat
 */

import {
  SpriteAnimationSystem,
  Animation,
} from "../../engine/core/SpriteAnimationSystem";
import { InputManager } from "../../engine/input/InputManager";
import {
  CollisionSystem,
  ColliderType,
  CollisionData,
  Vector2D,
} from "../../engine/physics/CollisionSystem";
import * as AudioService from "../../utils/audioService";
import { AttackSystem, Attack, AttackPhase } from "./AttackSystem";
import { BlockingSystem, BlockType, BlockingConfig } from "./BlockingSystem";
import { ComboSystem } from "./ComboSystem";
import { UIManager } from "../../ui/UIManager";

/**
 * Character stats configuration
 */
export interface CharacterStats {
  health: number;
  walkSpeed: number;
  jumpPower: number;
  weight: number; // Affects fall speed and knockback resistance
  attackPower: number; // Multiplier for base damage
}

/**
 * Attack frame data for move timing
 */
export interface AttackFrameData {
  startup: number; // Frames before hit becomes active
  active: number; // Frames the hit is active
  recovery: number; // Frames after hit before character can act again
  damage: number; // Base damage
  hitstun: number; // Frames opponent is stunned when hit
  blockstun: number; // Frames opponent is stunned when blocking
  knockback: Vector2D; // Knockback force vector
}

/**
 * Character movement states
 */
export enum CharacterState {
  IDLE,
  WALK_FORWARD,
  WALK_BACKWARD,
  JUMP_START,
  JUMP_UP,
  FALLING,
  CROUCH,
  ATTACK_LIGHT,
  ATTACK_MEDIUM,
  ATTACK_HEAVY,
  SPECIAL_1,
  SPECIAL_2,
  BLOCK_HIGH,
  BLOCK_LOW,
  HITSTUN,
  BLOCKSTUN,
  KNOCKDOWN,
  GUARD_BREAK,
}

/**
 * Character facing direction
 */
export enum FacingDirection {
  RIGHT = 1,
  LEFT = -1,
}

/**
 * Base character class for all fighters
 */
export class Character {
  // Identification
  protected id: string;
  protected name: string;

  // Position and physics
  protected position: Vector2D;
  protected velocity: Vector2D;
  protected acceleration: Vector2D;
  protected facingDirection: FacingDirection;
  protected isGrounded: boolean = true;

  // Stats
  protected stats: CharacterStats;
  protected currentHealth: number;

  // State management
  protected currentState: CharacterState = CharacterState.IDLE;
  protected previousState: CharacterState = CharacterState.IDLE;
  protected stateStartTime: number = 0;
  protected stateDuration: number = 0;
  protected stateData: any = null; // For state-specific data

  // Animation
  protected animationSystem: SpriteAnimationSystem;
  protected currentAnimation: Animation | null = null;
  protected spriteSheetId: string;

  // Colliders
  protected collisionSystem: CollisionSystem;
  protected hurtboxes: Map<string, CollisionData> = new Map();
  protected hitboxes: Map<string, CollisionData> = new Map();
  protected pushbox: CollisionData | null = null;

  // Input
  protected inputManager: InputManager | null = null;
  protected inputPlayerId: string | null = null;

  // Combat
  protected attackData: { [key: string]: AttackFrameData } = {};
  protected currentAttack: string | null = null;
  protected attackPhase: "startup" | "active" | "recovery" | null = null;
  protected attackTimer: number = 0;

  // Systems
  protected attackSystem: AttackSystem;
  protected blockingSystem: BlockingSystem;
  protected comboSystem: ComboSystem;

  // Constants
  protected readonly GRAVITY = 0.7;
  protected readonly TERMINAL_VELOCITY = 15;
  protected readonly GROUND_Y = 400; // Default ground position
  protected readonly FRICTION = 0.85;

  /**
   * Create a new character
   *
   * @param id Unique identifier for this character instance
   * @param name Display name of the character
   * @param spriteSheetId ID of the sprite sheet for animations
   * @param stats Character stat configuration
   * @param position Initial position
   * @param animationSystem Reference to the game's animation system
   * @param collisionSystem Reference to the game's collision system
   * @param playerNumber Player number (1 or 2)
   */
  constructor(
    id: string,
    name: string,
    spriteSheetId: string,
    stats: CharacterStats,
    position: Vector2D,
    animationSystem: SpriteAnimationSystem,
    collisionSystem: CollisionSystem,
    playerNumber: 1 | 2 = 1
  ) {
    this.id = id;
    this.name = name;
    this.spriteSheetId = spriteSheetId;
    this.stats = stats;
    this.currentHealth = stats.health;
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.facingDirection = FacingDirection.RIGHT;
    this.animationSystem = animationSystem;
    this.collisionSystem = collisionSystem;

    // Create systems
    this.attackSystem = new AttackSystem(this);
    this.blockingSystem = new BlockingSystem(this);
    this.comboSystem = new ComboSystem(this, this.attackSystem, playerNumber);

    // Initialize default colliders
    this.initializeColliders();
  }

  /**
   * Set the UI Manager for combo display
   * @param uiManager Reference to the UI manager
   */
  public setUIManager(uiManager: UIManager): void {
    this.comboSystem.setUIManager(uiManager);
  }

  /**
   * Set up input manager for this character
   * @param inputManager Input manager instance
   * @param playerId Player ID for input mapping
   */
  public setInputManager(inputManager: InputManager, playerId: string): void {
    this.inputManager = inputManager;
    this.inputPlayerId = playerId;
    this.attackSystem.setInputManager(inputManager);
  }

  /**
   * Initialize default colliders for the character
   */
  protected initializeColliders(): void {
    // Create pushbox (for character collision)
    this.pushbox = {
      id: `${this.id}_pushbox`,
      owner: this.id,
      type: ColliderType.PUSHBOX,
      shape: {
        x: this.position.x - 30,
        y: this.position.y - 80,
        width: 60,
        height: 160,
      },
      active: true,
    };

    // Register with collision system
    this.collisionSystem.registerCollider(this.pushbox);

    // Default hurtbox (full body)
    const defaultHurtbox: CollisionData = {
      id: `${this.id}_hurtbox_body`,
      owner: this.id,
      type: ColliderType.HURTBOX,
      shape: {
        x: this.position.x - 30,
        y: this.position.y - 80,
        width: 60,
        height: 160,
      },
      active: true,
    };

    this.hurtboxes.set("body", defaultHurtbox);
    this.collisionSystem.registerCollider(defaultHurtbox);
  }

  /**
   * Update character state based on input and game state
   * @param deltaTime Time since last update in milliseconds
   */
  public update(deltaTime: number): void {
    // Process input
    this.handleInput();

    // Update physics
    this.updatePhysics(deltaTime);

    // Update state
    this.updateState(deltaTime);

    // Update colliders
    this.updateColliders();

    // Update combat
    this.updateCombat(deltaTime);

    // Update blocking system
    this.blockingSystem.update(deltaTime);

    // Update combo system
    this.comboSystem.update(deltaTime);

    // Update animation
    this.updateAnimation(deltaTime);
  }

  /**
   * Process player input and update character state accordingly
   */
  protected handleInput(): void {
    if (!this.inputManager || !this.inputPlayerId) return;

    // Skip input handling if in a state that can't be interrupted
    if (this.isInLockedState()) return;

    const isRightPressed = this.inputManager.isPressed("right");
    const isLeftPressed = this.inputManager.isPressed("left");
    const isUpPressed = this.inputManager.isPressed("up");
    const isDownPressed = this.inputManager.isPressed("down");

    // Handle blocking (prioritize over other actions)
    const blockInput =
      this.facingDirection === FacingDirection.RIGHT
        ? this.inputManager.isPressed("left")
        : this.inputManager.isPressed("right");

    if (blockInput && this.isGrounded) {
      if (isDownPressed) {
        this.blockingSystem.setBlocking(true, true);
        this.changeState(CharacterState.BLOCK_LOW);
      } else {
        this.blockingSystem.setBlocking(true, false);
        this.changeState(CharacterState.BLOCK_HIGH);
      }
      return; // Skip other input processing when blocking
    } else {
      // Not blocking
      this.blockingSystem.setBlocking(false, false);
    }

    // Handle jump
    if (isUpPressed && this.isGrounded) {
      this.jump();
    }

    // Handle crouching
    else if (isDownPressed && this.isGrounded) {
      this.changeState(CharacterState.CROUCH);
    }

    // Handle walking
    else if (isRightPressed) {
      // If facing right, walk forward
      if (this.facingDirection === FacingDirection.RIGHT) {
        this.changeState(CharacterState.WALK_FORWARD);
      } else {
        this.changeState(CharacterState.WALK_BACKWARD);
      }
    } else if (isLeftPressed) {
      // If facing left, walk backward
      if (this.facingDirection === FacingDirection.LEFT) {
        this.changeState(CharacterState.WALK_FORWARD);
      } else {
        this.changeState(CharacterState.WALK_BACKWARD);
      }
    }
    // Return to idle if no movement keys pressed
    else if (
      this.isGrounded &&
      (this.currentState === CharacterState.WALK_FORWARD ||
        this.currentState === CharacterState.WALK_BACKWARD ||
        this.currentState === CharacterState.BLOCK_HIGH ||
        this.currentState === CharacterState.BLOCK_LOW)
    ) {
      this.changeState(CharacterState.IDLE);
    }

    // Handle attacks
    if (this.inputManager.isJustPressed("attack_light")) {
      this.performAttack("light");
    } else if (this.inputManager.isJustPressed("attack_medium")) {
      this.performAttack("medium");
    } else if (this.inputManager.isJustPressed("attack_heavy")) {
      this.performAttack("heavy");
    } else if (this.inputManager.isJustPressed("special_1")) {
      this.performAttack("special1");
    }
  }

  /**
   * Update character physics (gravity, velocity, position)
   * @param deltaTime Time since last update in milliseconds
   */
  protected updatePhysics(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert ms to seconds

    // Apply gravity if not on ground
    if (!this.isGrounded) {
      this.acceleration.y = this.GRAVITY;
    } else {
      this.acceleration.y = 0;
      this.velocity.y = 0;
    }

    // Apply horizontal movement based on state
    if (this.currentState === CharacterState.WALK_FORWARD) {
      this.velocity.x = this.stats.walkSpeed * this.facingDirection;
    } else if (this.currentState === CharacterState.WALK_BACKWARD) {
      this.velocity.x = -this.stats.walkSpeed * this.facingDirection;
    } else if (this.isGrounded) {
      // Apply friction on ground
      this.velocity.x *= this.FRICTION;

      // Stop completely at low speeds
      if (Math.abs(this.velocity.x) < 0.1) {
        this.velocity.x = 0;
      }
    }

    // Update velocity using acceleration
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y;

    // Clamp velocity to terminal velocity
    if (this.velocity.y > this.TERMINAL_VELOCITY) {
      this.velocity.y = this.TERMINAL_VELOCITY;
    }

    // Update position
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Check if landed on ground
    if (this.position.y >= this.GROUND_Y && !this.isGrounded) {
      this.position.y = this.GROUND_Y;
      this.land();
    }
  }

  /**
   * Update character state based on current conditions
   * @param deltaTime Time since last update in milliseconds
   */
  protected updateState(deltaTime: number): void {
    const stateTime = performance.now() - this.stateStartTime;

    switch (this.currentState) {
      case CharacterState.JUMP_START:
        if (stateTime >= 50) {
          // Short jump startup
          this.changeState(CharacterState.JUMP_UP);
        }
        break;

      case CharacterState.JUMP_UP:
        if (this.velocity.y > 0) {
          this.changeState(CharacterState.FALLING);
        }
        break;

      case CharacterState.HITSTUN:
      case CharacterState.BLOCKSTUN:
      case CharacterState.GUARD_BREAK:
        if (stateTime >= this.stateDuration) {
          this.changeState(CharacterState.IDLE);
        }
        break;

      case CharacterState.KNOCKDOWN:
        if (stateTime >= this.stateDuration) {
          this.getUp();
        }
        break;
    }
  }

  /**
   * Update character's colliders based on current position and state
   */
  protected updateColliders(): void {
    if (!this.pushbox) return;

    // Update pushbox
    const pushboxShape = this.pushbox.shape as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    pushboxShape.x = this.position.x - pushboxShape.width / 2;
    pushboxShape.y = this.position.y - pushboxShape.height;
    this.collisionSystem.updateCollider(this.pushbox.id, {
      shape: pushboxShape,
    });

    // Update hurtboxes
    this.hurtboxes.forEach((hurtbox, key) => {
      const shape = hurtbox.shape as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      shape.x = this.position.x - shape.width / 2;
      shape.y = this.position.y - shape.height;
      this.collisionSystem.updateCollider(hurtbox.id, { shape });
    });

    // Update hitboxes positions if any are active
    this.hitboxes.forEach((hitbox, key) => {
      if (!hitbox.active) return;

      const shape = hitbox.shape as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      // Adjust hitbox position based on facing direction
      const offsetX =
        this.facingDirection === FacingDirection.RIGHT
          ? shape.width / 2
          : -shape.width / 2;
      shape.x = this.position.x + offsetX;
      shape.y = this.position.y - shape.height / 2;
      this.collisionSystem.updateCollider(hitbox.id, { shape });
    });
  }

  /**
   * Update combat-related state and timers
   * @param deltaTime Time since last update in milliseconds
   */
  protected updateCombat(deltaTime: number): void {
    // Use the AttackSystem for combat updates
    this.attackSystem.update(deltaTime, [
      "attack_light",
      "attack_medium",
      "attack_heavy",
      "special_1",
      "special_2",
    ]);
  }

  /**
   * Update character animation based on current state
   */
  protected updateAnimation(deltaTime: number): void {
    // Animation state machine
    let animationId = this.getAnimationForState();

    // Play the appropriate animation
    if (animationId) {
      this.currentAnimation = this.animationSystem.playAnimation(
        animationId,
        this.id,
        this.currentAnimation?.getName() !== animationId // Reset if changing animations
      );
    }
  }

  /**
   * Get the appropriate animation ID for the current state
   * @returns Animation ID string
   */
  protected getAnimationForState(): string {
    // Default implementation - should be overridden by character classes
    switch (this.currentState) {
      case CharacterState.IDLE:
        return "idle";
      case CharacterState.WALK_FORWARD:
        return "walk";
      case CharacterState.WALK_BACKWARD:
        return "walk_back";
      case CharacterState.JUMP_START:
        return "jump_start";
      case CharacterState.JUMP_UP:
      case CharacterState.FALLING:
        return "jump";
      case CharacterState.CROUCH:
        return "crouch";
      case CharacterState.BLOCK_HIGH:
        return "block_high";
      case CharacterState.BLOCK_LOW:
        return "block_low";
      case CharacterState.BLOCKSTUN:
        return "blockstun";
      case CharacterState.ATTACK_LIGHT:
        return "attack_light";
      case CharacterState.ATTACK_MEDIUM:
        return "attack_medium";
      case CharacterState.ATTACK_HEAVY:
        return "attack_heavy";
      case CharacterState.HITSTUN:
        return "hit";
      case CharacterState.KNOCKDOWN:
        return "knockdown";
      case CharacterState.GUARD_BREAK:
        return "guard_break";
      default:
        return "idle";
    }
  }

  /**
   * Render the character
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Skip if no animation
    if (!this.currentAnimation) return;

    // Determine if character should be flipped based on facing direction
    const flipX = this.facingDirection === FacingDirection.LEFT;

    // Render the current animation
    this.animationSystem.renderAnimation(
      ctx,
      this.spriteSheetId,
      this.currentAnimation.getName(),
      this.id,
      this.position.x,
      this.position.y,
      flipX,
      false,
      1.0
    );

    // Draw guard meter if blocking or recovering guard
    if (
      this.currentState === CharacterState.BLOCK_HIGH ||
      this.currentState === CharacterState.BLOCK_LOW ||
      this.blockingSystem.getGuardMeterPercentage() < 100
    ) {
      this.renderGuardMeter(ctx);
    }

    // Debug rendering for hitboxes/hurtboxes
    this.renderDebugColliders(ctx);
  }

  /**
   * Render guard meter above the character when blocking
   * @param ctx Canvas rendering context
   */
  protected renderGuardMeter(ctx: CanvasRenderingContext2D): void {
    const meterWidth = 60;
    const meterHeight = 6;
    const percentage = this.blockingSystem.getGuardMeterPercentage();

    // Draw meter background
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(
      this.position.x - meterWidth / 2,
      this.position.y - 100,
      meterWidth,
      meterHeight
    );

    // Determine color based on meter level
    let color;
    if (percentage > 70) {
      color = "rgba(0, 255, 0, 0.8)";
    } else if (percentage > 30) {
      color = "rgba(255, 255, 0, 0.8)";
    } else {
      color = "rgba(255, 0, 0, 0.8)";
    }

    // Draw meter fill
    ctx.fillStyle = color;
    ctx.fillRect(
      this.position.x - meterWidth / 2,
      this.position.y - 100,
      (meterWidth * percentage) / 100,
      meterHeight
    );

    // Draw border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      this.position.x - meterWidth / 2,
      this.position.y - 100,
      meterWidth,
      meterHeight
    );
  }

  /**
   * Render debug visualization for colliders
   * @param ctx Canvas rendering context
   */
  protected renderDebugColliders(ctx: CanvasRenderingContext2D): void {
    // Skip debug rendering in production
    if (process.env.NODE_ENV === "production") return;

    // Helper to draw a collider
    const drawCollider = (collider: CollisionData, color: string) => {
      if (!collider.active) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      const shape = collider.shape as any;
      if ("width" in shape) {
        // Rectangle
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if ("radius" in shape) {
        // Circle
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    // Draw pushbox
    if (this.pushbox) {
      drawCollider(this.pushbox, "rgba(0, 255, 0, 0.5)");
    }

    // Draw hurtboxes
    this.hurtboxes.forEach((hurtbox) => {
      drawCollider(hurtbox, "rgba(0, 0, 255, 0.5)");
    });

    // Draw hitboxes
    this.hitboxes.forEach((hitbox) => {
      drawCollider(hitbox, "rgba(255, 0, 0, 0.5)");
    });
  }

  /**
   * Change the character's state
   * @param newState The state to change to
   * @param stateData Optional data for the new state
   */
  public changeState(newState: CharacterState, stateData: any = null): void {
    // Don't change if it's the same state
    if (newState === this.currentState) return;

    // Don't allow state changes if in a locked state
    if (this.isInLockedState() && !this.canInterruptCurrentState(newState))
      return;

    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateStartTime = performance.now();
    this.stateData = stateData;

    // Handle state entry actions
    this.onStateEnter(newState);
  }

  /**
   * Check if the character is in a state that cannot be interrupted
   */
  protected isInLockedState(): boolean {
    return (
      this.currentState === CharacterState.ATTACK_LIGHT ||
      this.currentState === CharacterState.ATTACK_MEDIUM ||
      this.currentState === CharacterState.ATTACK_HEAVY ||
      this.currentState === CharacterState.SPECIAL_1 ||
      this.currentState === CharacterState.SPECIAL_2 ||
      this.currentState === CharacterState.HITSTUN ||
      this.currentState === CharacterState.BLOCKSTUN ||
      this.currentState === CharacterState.GUARD_BREAK ||
      this.currentState === CharacterState.KNOCKDOWN ||
      (this.currentState === CharacterState.JUMP_START && !this.isGrounded)
    );
  }

  /**
   * Check if the current state can be interrupted by a new state
   * @param newState The state trying to interrupt
   */
  protected canInterruptCurrentState(newState: CharacterState): boolean {
    // Hitstun, blockstun can always interrupt attacks
    if (
      newState === CharacterState.HITSTUN ||
      newState === CharacterState.BLOCKSTUN ||
      newState === CharacterState.GUARD_BREAK
    ) {
      return true;
    }

    // Other interactions depend on specific game design
    return false;
  }

  /**
   * Handle state entry actions
   * @param state The state being entered
   */
  protected onStateEnter(state: CharacterState): void {
    switch (state) {
      case CharacterState.JUMP_START:
        // Play jump start sound
        AudioService.playSound("jump_start");
        break;

      case CharacterState.HITSTUN:
        // Play hit sound
        AudioService.playSound("hit");
        break;

      case CharacterState.BLOCK_HIGH:
      case CharacterState.BLOCK_LOW:
        // Play block start sound if just started blocking
        if (
          this.previousState !== CharacterState.BLOCK_HIGH &&
          this.previousState !== CharacterState.BLOCK_LOW
        ) {
          AudioService.playSound("block_start");
        }
        break;

      case CharacterState.BLOCKSTUN:
        // Play block hit sound
        AudioService.playSound("block");
        break;

      case CharacterState.GUARD_BREAK:
        // Play guard break sound
        AudioService.playSound("guard_break");
        break;
    }
  }

  /**
   * Make the character jump
   */
  protected jump(): void {
    this.changeState(CharacterState.JUMP_START);
    this.isGrounded = false;
    // Apply jump force after short startup
    setTimeout(() => {
      this.velocity.y = -this.stats.jumpPower;
      AudioService.playSound("jump");
    }, 50);
  }

  /**
   * Handle landing after a jump
   */
  protected land(): void {
    this.isGrounded = true;
    this.changeState(CharacterState.IDLE);
    AudioService.playSound("land");
  }

  /**
   * Get up after being knocked down
   */
  protected getUp(): void {
    this.changeState(CharacterState.IDLE);
  }

  /**
   * Perform an attack
   * @param attackType The type of attack to perform
   */
  protected performAttack(attackType: string): void {
    if (!this.attackData[attackType]) return;

    // Set attack state based on attack type
    switch (attackType) {
      case "light":
        this.changeState(CharacterState.ATTACK_LIGHT);
        break;
      case "medium":
        this.changeState(CharacterState.ATTACK_MEDIUM);
        break;
      case "heavy":
        this.changeState(CharacterState.ATTACK_HEAVY);
        break;
      case "special1":
        this.changeState(CharacterState.SPECIAL_1);
        break;
      case "special2":
        this.changeState(CharacterState.SPECIAL_2);
        break;
    }

    // Set up attack properties
    this.currentAttack = attackType;
    this.attackPhase = "startup";
    const attackData = this.attackData[attackType];
    this.attackTimer = attackData.startup * 16.67; // Convert frames to ms (assuming 60fps)

    // Play attack sound
    AudioService.playSound(`attack_${attackType}`);
  }

  /**
   * Activate hitboxes for an attack
   * @param attackType The type of attack
   */
  protected activateHitboxes(attackType: string): void {
    // Check if we have hitboxes defined for this attack
    const hitbox = this.hitboxes.get(attackType);
    if (!hitbox) return;

    // Activate the hitbox
    hitbox.active = true;
    this.collisionSystem.setColliderActive(hitbox.id, true);
  }

  /**
   * Deactivate all hitboxes
   */
  protected deactivateHitboxes(): void {
    this.hitboxes.forEach((hitbox) => {
      hitbox.active = false;
      this.collisionSystem.setColliderActive(hitbox.id, false);
    });
  }

  /**
   * End the current attack
   */
  protected endAttack(): void {
    this.currentAttack = null;
    this.attackPhase = null;
    this.changeState(CharacterState.IDLE);
  }

  /**
   * Take damage from an attack
   * @param damage Amount of damage to take
   * @param attacker The character who dealt the damage
   * @param attackFrameData Data about the attack
   * @returns True if the character was hit (not blocking)
   */
  public takeDamage(
    damage: number,
    attacker: Character,
    attackFrameData: AttackFrameData
  ): boolean {
    const attackerAttackSystem = attacker.getAttackSystem();
    const currentAttack = attackerAttackSystem.getCurrentAttack();

    // If there's no current attack, just apply the damage directly
    if (!currentAttack) {
      this.currentHealth -= damage;
      return true;
    }

    // Check if attack can be blocked
    if (this.blockingSystem.canBlockAttack(currentAttack)) {
      // Process the block and get reduced damage
      const reducedDamage = this.blockingSystem.processBlock(
        currentAttack,
        attacker
      );

      // Apply the reduced damage
      this.currentHealth = Math.max(0, this.currentHealth - reducedDamage);

      return false; // Attack was blocked
    } else {
      // Take full damage
      this.currentHealth = Math.max(0, this.currentHealth - damage);

      // Apply hitstun and knockback
      this.changeState(CharacterState.HITSTUN);
      this.stateDuration = attackFrameData.hitstun * 16.67; // Convert frames to ms

      // Apply knockback
      const knockbackDirection =
        attacker.getPosition().x < this.position.x ? 1 : -1;
      this.velocity.x = attackFrameData.knockback.x * knockbackDirection;
      this.velocity.y = -attackFrameData.knockback.y; // Negative because Y is up

      // Register hit with the combo system
      attacker
        .getComboSystem()
        .onHit(this, currentAttack, currentAttack.frameData.damage);

      // Play hit sound
      AudioService.playSound("hit");

      return true; // Attack hit successfully
    }
  }

  /**
   * Apply a force vector to the character (for knockback, etc.)
   * @param force Force vector to apply
   */
  public applyForce(force: Vector2D): void {
    this.velocity.x += force.x;
    this.velocity.y += force.y;
  }

  /**
   * Set the duration for timed states like hitstun, blockstun
   * @param duration Duration in milliseconds
   */
  public setStateDuration(duration: number): void {
    this.stateDuration = duration;
  }

  /**
   * Get the character's attack system
   */
  public getAttackSystem(): AttackSystem {
    return this.attackSystem;
  }

  /**
   * Get the character's blocking system
   */
  public getBlockingSystem(): BlockingSystem {
    return this.blockingSystem;
  }

  /**
   * Get the character's combo system
   */
  public getComboSystem(): ComboSystem {
    return this.comboSystem;
  }

  /**
   * Increment combo counter (legacy method - delegates to combo system)
   */
  public incrementCombo(): void {
    // This is kept for backward compatibility
    // The combo system now handles combo tracking internally
  }

  /**
   * Get current combo count
   */
  public getComboCount(): number {
    return this.comboSystem.getComboCount();
  }

  /**
   * Get current health value
   */
  public getHealth(): number {
    return this.currentHealth;
  }

  /**
   * Get character position
   */
  public getPosition(): Vector2D {
    return { ...this.position };
  }

  /**
   * Set character position
   */
  public setPosition(position: Vector2D): void {
    this.position = { ...position };
  }

  /**
   * Set character facing direction
   */
  public setFacingDirection(direction: FacingDirection): void {
    this.facingDirection = direction;
  }

  /**
   * Get current state
   */
  public getState(): CharacterState {
    return this.currentState;
  }

  /**
   * Check if the character is dead
   */
  public isDead(): boolean {
    return this.currentHealth <= 0;
  }

  /**
   * Check if the character is on the ground
   */
  public isOnGround(): boolean {
    return this.isGrounded;
  }

  /**
   * Check if the character is crouching
   */
  public isCrouching(): boolean {
    return this.currentState === CharacterState.CROUCH;
  }

  /**
   * Check if the character is currently blocking
   */
  public isBlocking(): boolean {
    return this.blockingSystem.getIsBlocking();
  }

  /**
   * Get character's facing direction
   */
  public getFacingDirection(): FacingDirection {
    return this.facingDirection;
  }

  /**
   * Get character's unique ID
   */
  public getId(): string {
    return this.id;
  }
}
