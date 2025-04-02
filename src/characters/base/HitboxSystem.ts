/**
 * HitboxSystem.ts
 * Specialized system for managing fighting game hitboxes and hurtboxes
 */

import {
  CollisionSystem,
  ColliderType,
  CollisionData,
  Vector2D,
} from "../../engine/physics/CollisionSystem";
import { Character, AttackFrameData } from "./Character";

/**
 * Types of boxes in a fighting game
 */
export enum BoxType {
  HITBOX, // Deals damage
  HURTBOX, // Receives damage
  PUSHBOX, // For character collision
  THROWBOX, // For throw attacks
  BLOCKBOX, // For blocking attacks
}

/**
 * Hitbox definition with frame timing
 */
export interface HitboxDefinition {
  /**
   * Unique ID for this hitbox
   */
  id: string;

  /**
   * Type of box
   */
  type: BoxType;

  /**
   * X offset from character position (adjusted for facing direction)
   */
  offsetX: number;

  /**
   * Y offset from character position
   */
  offsetY: number;

  /**
   * Width of the hitbox
   */
  width: number;

  /**
   * Height of the hitbox
   */
  height: number;

  /**
   * Frame when this hitbox becomes active (0 = first frame of the move)
   */
  startFrame: number;

  /**
   * Frame when this hitbox becomes inactive
   */
  endFrame: number;

  /**
   * Associated attack data (damage, knockback, etc.)
   */
  attackData?: AttackFrameData;
}

/**
 * Attack definition with multiple hitboxes
 */
export interface AttackDefinition {
  /**
   * Name of the attack
   */
  name: string;

  /**
   * Total duration in frames
   */
  totalFrames: number;

  /**
   * Array of hitboxes for this attack
   */
  hitboxes: HitboxDefinition[];
}

/**
 * Manages hitbox and hurtbox creation, activation, and collision detection for fighting game characters
 */
export class HitboxSystem {
  /**
   * Reference to the collision system
   */
  private collisionSystem: CollisionSystem;

  /**
   * Character that owns this hitbox system
   */
  private owner: Character;

  /**
   * Map of registered attacks
   */
  private attacks: Map<string, AttackDefinition> = new Map();

  /**
   * Currently active attack
   */
  private currentAttack: string | null = null;

  /**
   * Current frame of the active attack
   */
  private currentFrame: number = 0;

  /**
   * Map of active collider IDs to their CollisionData
   */
  private activeColliders: Map<string, CollisionData> = new Map();

  /**
   * Permanent colliders (pushbox, standing hurtbox, etc.)
   */
  private permanentColliders: Map<string, CollisionData> = new Map();

  /**
   * Create a new hitbox system
   * @param owner The character that owns this hitbox system
   * @param collisionSystem Reference to the game's collision system
   */
  constructor(owner: Character, collisionSystem: CollisionSystem) {
    this.owner = owner;
    this.collisionSystem = collisionSystem;
  }

  /**
   * Register an attack definition
   * @param attackDefinition The attack definition to register
   */
  public registerAttack(attackDefinition: AttackDefinition): void {
    this.attacks.set(attackDefinition.name, attackDefinition);
  }

  /**
   * Register a permanent collider (pushbox, default hurtbox)
   * @param id Unique identifier for this collider
   * @param boxType Type of box
   * @param offsetX X offset from character position
   * @param offsetY Y offset from character position
   * @param width Width of the box
   * @param height Height of the box
   */
  public registerPermanentCollider(
    id: string,
    boxType: BoxType,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
  ): void {
    // Convert BoxType to ColliderType
    const colliderType = this.boxTypeToColliderType(boxType);

    // Create the CollisionData
    const collider: CollisionData = {
      id: `${this.owner.getId()}_${id}`,
      owner: this.owner.getId(),
      type: colliderType,
      shape: {
        x: 0, // Will be updated in updateColliderPositions
        y: 0, // Will be updated in updateColliderPositions
        width,
        height,
      },
      active: true,
    };

    // Store additional data for our own positioning
    const extendedData = {
      ...collider,
      offsetX,
      offsetY,
    };

    // Register with the collision system
    this.collisionSystem.registerCollider(collider);

    // Store in our permanent colliders map
    this.permanentColliders.set(id, extendedData);
  }

  /**
   * Start an attack by name
   * @param attackName Name of the attack to perform
   * @returns Whether the attack was successfully started
   */
  public startAttack(attackName: string): boolean {
    // Check if attack exists
    const attack = this.attacks.get(attackName);
    if (!attack) {
      console.warn(`Attack "${attackName}" not found`);
      return false;
    }

    // End any current attack
    this.endCurrentAttack();

    // Set as current attack
    this.currentAttack = attackName;
    this.currentFrame = 0;

    return true;
  }

  /**
   * End the current attack if any
   */
  public endCurrentAttack(): void {
    if (!this.currentAttack) return;

    // Deactivate all attack hitboxes
    this.activeColliders.forEach((collider, id) => {
      this.collisionSystem.removeCollider(collider.id);
    });

    // Clear active colliders
    this.activeColliders.clear();

    // Reset current attack
    this.currentAttack = null;
    this.currentFrame = 0;
  }

  /**
   * Update hitbox status based on current attack and frame
   * @param deltaTime Time since the last frame in milliseconds
   */
  public update(deltaTime: number): void {
    // Update positions of all permanent colliders
    this.updatePermanentColliders();

    // If no attack is active, nothing else to do
    if (!this.currentAttack) {
      return;
    }

    const attack = this.attacks.get(this.currentAttack)!;

    // Advance the frame (assuming ~60fps)
    const frameAdvance = deltaTime / 16.67;
    this.currentFrame += frameAdvance;

    // Check if attack is finished
    if (this.currentFrame >= attack.totalFrames) {
      this.endCurrentAttack();
      return;
    }

    // Update active hitboxes based on current frame
    this.updateActiveHitboxes(attack);

    // Update positions of active hitboxes
    this.updateActiveColliderPositions();
  }

  /**
   * Update which hitboxes are active based on the current frame
   * @param attack The current attack definition
   */
  private updateActiveHitboxes(attack: AttackDefinition): void {
    const frame = this.currentFrame;

    // Check each hitbox in the attack
    for (const hitbox of attack.hitboxes) {
      const colliderKey = `${attack.name}_${hitbox.id}`;

      // Activate hitboxes that should be active at this frame
      if (frame >= hitbox.startFrame && frame < hitbox.endFrame) {
        // Already active, nothing to do
        if (this.activeColliders.has(colliderKey)) {
          continue;
        }

        // Create and register a new collider
        const colliderType = this.boxTypeToColliderType(hitbox.type);
        const collider: CollisionData = {
          id: `${this.owner.getId()}_${colliderKey}`,
          owner: this.owner.getId(),
          type: colliderType,
          shape: {
            x: 0, // Will be updated in updateActiveColliderPositions
            y: 0, // Will be updated in updateActiveColliderPositions
            width: hitbox.width,
            height: hitbox.height,
          },
          active: true,
          damage: hitbox.attackData?.damage,
          knockback: hitbox.attackData?.knockback,
        };

        // Store additional data for our own positioning
        const extendedData = {
          ...collider,
          offsetX: hitbox.offsetX,
          offsetY: hitbox.offsetY,
        };

        this.collisionSystem.registerCollider(collider);
        this.activeColliders.set(colliderKey, extendedData);
      }
      // Deactivate hitboxes that should no longer be active
      else if (this.activeColliders.has(colliderKey)) {
        const collider = this.activeColliders.get(colliderKey)!;
        this.collisionSystem.removeCollider(collider.id);
        this.activeColliders.delete(colliderKey);
      }
    }
  }

  /**
   * Update positions of permanent colliders based on character position
   */
  private updatePermanentColliders(): void {
    const position = this.owner.getPosition();
    const facingDirection = this.owner.getFacingDirection();

    this.permanentColliders.forEach((collider) => {
      const shape = collider.shape as {
        x: number;
        y: number;
        width: number;
        height: number;
      };

      // Calculate X position (adjusted for facing direction)
      const adjustedOffsetX =
        facingDirection > 0 ? collider.offsetX : -collider.offsetX;

      shape.x = position.x + adjustedOffsetX;
      shape.y = position.y + collider.offsetY;

      this.collisionSystem.updateCollider(collider.id, { shape });
    });
  }

  /**
   * Update positions of active colliders based on character position
   */
  private updateActiveColliderPositions(): void {
    const position = this.owner.getPosition();
    const facingDirection = this.owner.getFacingDirection();

    this.activeColliders.forEach((collider) => {
      const shape = collider.shape as {
        x: number;
        y: number;
        width: number;
        height: number;
      };

      // Calculate X position (adjusted for facing direction)
      const adjustedOffsetX =
        facingDirection > 0 ? collider.offsetX : -collider.offsetX;

      shape.x = position.x + adjustedOffsetX;
      shape.y = position.y + collider.offsetY;

      this.collisionSystem.updateCollider(collider.id, { shape });
    });
  }

  /**
   * Convert BoxType to ColliderType
   * @param boxType BoxType to convert
   * @returns Corresponding ColliderType
   */
  private boxTypeToColliderType(boxType: BoxType): ColliderType {
    switch (boxType) {
      case BoxType.HITBOX:
        return ColliderType.HITBOX;
      case BoxType.HURTBOX:
        return ColliderType.HURTBOX;
      case BoxType.PUSHBOX:
        return ColliderType.PUSHBOX;
      case BoxType.THROWBOX:
        return ColliderType.HITBOX; // Use HITBOX for throws too
      case BoxType.BLOCKBOX:
        return ColliderType.BLOCKBOX;
      default:
        return ColliderType.HURTBOX; // Default
    }
  }

  /**
   * Check if an attack is currently active
   */
  public isAttackActive(): boolean {
    return this.currentAttack !== null;
  }

  /**
   * Get the current attack name
   */
  public getCurrentAttack(): string | null {
    return this.currentAttack;
  }

  /**
   * Get the current attack frame
   */
  public getCurrentFrame(): number {
    return this.currentFrame;
  }
}
