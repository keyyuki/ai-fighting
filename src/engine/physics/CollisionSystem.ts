/**
 * CollisionSystem.ts
 * Handles collision detection for hitboxes and hurtboxes in a fighting game
 */

/**
 * 2D vector representation
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Represents a rectangle for collision detection
 */
export interface CollisionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Represents a circle for collision detection
 */
export interface CollisionCircle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Types of collision shapes supported
 */
export type CollisionShape = CollisionRect | CollisionCircle;

/**
 * Types of colliders in a fighting game
 */
export enum ColliderType {
  HITBOX, // Deals damage
  HURTBOX, // Can receive damage
  BLOCKBOX, // For blocking
  THROWBOX, // For throw attacks
  PUSHBOX, // For character collision
}

/**
 * Interface for collision data that includes information about the collision
 */
export interface CollisionData {
  id: string;
  owner: string;
  type: ColliderType;
  shape: CollisionShape;
  active: boolean;
  damage?: number;
  knockback?: Vector2D;
  priority?: number;
}

/**
 * Result of a collision between two colliders
 */
export interface CollisionResult {
  colliderA: CollisionData;
  colliderB: CollisionData;
  intersecting: boolean;
  penetration?: Vector2D; // Vector representing how much and in what direction objects are penetrating
}

/**
 * Manages collision detection between game objects
 */
export class CollisionSystem {
  private colliders: Map<string, CollisionData> = new Map();

  /**
   * Register a collider in the system
   * @param collider The collider data to register
   */
  public registerCollider(collider: CollisionData): void {
    this.colliders.set(collider.id, collider);
  }

  /**
   * Update an existing collider
   * @param id The id of the collider to update
   * @param updates Partial updates to apply to the collider
   */
  public updateCollider(id: string, updates: Partial<CollisionData>): void {
    const current = this.colliders.get(id);
    if (current) {
      this.colliders.set(id, { ...current, ...updates });
    }
  }

  /**
   * Remove a collider from the system
   * @param id The id of the collider to remove
   */
  public removeCollider(id: string): void {
    this.colliders.delete(id);
  }

  /**
   * Activate or deactivate a collider
   * @param id The id of the collider
   * @param active Whether the collider should be active
   */
  public setColliderActive(id: string, active: boolean): void {
    const collider = this.colliders.get(id);
    if (collider) {
      collider.active = active;
      this.colliders.set(id, collider);
    }
  }

  /**
   * Get all active colliders of a specific type
   * @param type The type of collider to retrieve
   * @returns Array of active colliders matching the type
   */
  public getActiveColliders(type?: ColliderType): CollisionData[] {
    return Array.from(this.colliders.values()).filter((collider) => {
      return collider.active && (type === undefined || collider.type === type);
    });
  }

  /**
   * Check for all collisions between hitboxes and hurtboxes
   * @returns Array of collision results
   */
  public checkAllCollisions(): CollisionResult[] {
    const results: CollisionResult[] = [];

    // Get all active hitboxes
    const hitboxes = this.getActiveColliders(ColliderType.HITBOX);

    // Get all active hurtboxes and blockboxes
    const hurtboxes = [
      ...this.getActiveColliders(ColliderType.HURTBOX),
      ...this.getActiveColliders(ColliderType.BLOCKBOX),
    ];

    // Check each hitbox against each hurtbox
    for (const hitbox of hitboxes) {
      for (const hurtbox of hurtboxes) {
        // Skip if they belong to the same owner
        if (hitbox.owner === hurtbox.owner) continue;

        const collision = this.testCollision(hitbox, hurtbox);
        if (collision.intersecting) {
          results.push(collision);
        }
      }
    }

    // Check character pushboxes against each other
    const pushboxes = this.getActiveColliders(ColliderType.PUSHBOX);
    for (let i = 0; i < pushboxes.length; i++) {
      for (let j = i + 1; j < pushboxes.length; j++) {
        const collision = this.testCollision(pushboxes[i], pushboxes[j]);
        if (collision.intersecting) {
          results.push(collision);
        }
      }
    }

    return results;
  }

  /**
   * Test collision between two specific colliders
   * @param a First collider
   * @param b Second collider
   * @returns Collision result
   */
  public testCollision(a: CollisionData, b: CollisionData): CollisionResult {
    // Skip collision test if either collider is inactive
    if (!a.active || !b.active) {
      return { colliderA: a, colliderB: b, intersecting: false };
    }

    // Determine collision based on shape types
    let intersecting = false;
    let penetration: Vector2D | undefined;

    // Check if both shapes are rectangles
    if ("width" in a.shape && "width" in b.shape) {
      const result = this.testRectRect(a.shape, b.shape);
      intersecting = result.intersecting;
      penetration = result.penetration;
    }
    // Check if both shapes are circles
    else if ("radius" in a.shape && "radius" in b.shape) {
      const result = this.testCircleCircle(a.shape, b.shape);
      intersecting = result.intersecting;
      penetration = result.penetration;
    }
    // Check if first is rect, second is circle
    else if ("width" in a.shape && "radius" in b.shape) {
      const result = this.testRectCircle(a.shape, b.shape);
      intersecting = result.intersecting;
      penetration = result.penetration;
    }
    // Check if first is circle, second is rect
    else if ("radius" in a.shape && "width" in b.shape) {
      const result = this.testRectCircle(b.shape, a.shape);
      intersecting = result.intersecting;
      penetration = result.penetration;

      // Flip penetration direction
      if (penetration) {
        penetration.x = -penetration.x;
        penetration.y = -penetration.y;
      }
    }

    return { colliderA: a, colliderB: b, intersecting, penetration };
  }

  /**
   * Test collision between two rectangles
   */
  private testRectRect(
    rectA: CollisionRect,
    rectB: CollisionRect
  ): {
    intersecting: boolean;
    penetration?: Vector2D;
  } {
    // Check if rectangles overlap
    const overlapX = Math.min(
      rectA.x + rectA.width - rectB.x,
      rectB.x + rectB.width - rectA.x
    );

    const overlapY = Math.min(
      rectA.y + rectA.height - rectB.y,
      rectB.y + rectB.height - rectA.y
    );

    const intersecting = overlapX > 0 && overlapY > 0;

    let penetration: Vector2D | undefined;
    if (intersecting) {
      // Calculate penetration vector (smallest displacement to resolve collision)
      penetration = {
        x: overlapX * (rectA.x < rectB.x ? -1 : 1),
        y: overlapY * (rectA.y < rectB.y ? -1 : 1),
      };

      // Use the smallest overlap axis to resolve
      if (Math.abs(overlapX) < Math.abs(overlapY)) {
        penetration.y = 0;
      } else {
        penetration.x = 0;
      }
    }

    return { intersecting, penetration };
  }

  /**
   * Test collision between two circles
   */
  private testCircleCircle(
    circleA: CollisionCircle,
    circleB: CollisionCircle
  ): {
    intersecting: boolean;
    penetration?: Vector2D;
  } {
    // Calculate distance between circle centers
    const dx = circleB.x - circleA.x;
    const dy = circleB.y - circleA.y;
    const distanceSquared = dx * dx + dy * dy;

    const combinedRadii = circleA.radius + circleB.radius;
    const intersecting = distanceSquared <= combinedRadii * combinedRadii;

    let penetration: Vector2D | undefined;
    if (intersecting) {
      // Calculate penetration vector
      const distance = Math.sqrt(distanceSquared);
      const overlap = combinedRadii - distance;

      // Normalize direction and scale by overlap
      const normalX = dx / distance;
      const normalY = dy / distance;

      penetration = {
        x: normalX * overlap,
        y: normalY * overlap,
      };
    }

    return { intersecting, penetration };
  }

  /**
   * Test collision between a rectangle and a circle
   */
  private testRectCircle(
    rect: CollisionRect,
    circle: CollisionCircle
  ): {
    intersecting: boolean;
    penetration?: Vector2D;
  } {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // Calculate distance from closest point to circle center
    const dx = closestX - circle.x;
    const dy = closestY - circle.y;
    const distanceSquared = dx * dx + dy * dy;

    const intersecting = distanceSquared <= circle.radius * circle.radius;

    let penetration: Vector2D | undefined;
    if (intersecting) {
      // Calculate penetration vector
      if (distanceSquared === 0) {
        // Circle center is inside the rectangle, find closest edge
        const edgeDists = [
          { x: circle.x - rect.x, y: 0 }, // Left edge
          { x: rect.x + rect.width - circle.x, y: 0 }, // Right edge
          { x: 0, y: circle.y - rect.y }, // Top edge
          { x: 0, y: rect.y + rect.height - circle.y }, // Bottom edge
        ];

        // Find edge with minimum distance
        let minDist = Number.MAX_VALUE;
        let minEdge = { x: 0, y: 0 };

        for (const edge of edgeDists) {
          const dist = Math.abs(edge.x || edge.y);
          if (dist < minDist) {
            minDist = dist;
            minEdge = edge;
          }
        }

        penetration = {
          x: minEdge.x + (minEdge.x > 0 ? circle.radius : -circle.radius),
          y: minEdge.y + (minEdge.y > 0 ? circle.radius : -circle.radius),
        };
      } else {
        // Normal case: closest point is on edge of rectangle
        const distance = Math.sqrt(distanceSquared);
        const overlap = circle.radius - distance;

        // Normalize direction and scale by overlap
        const normalX = dx / distance;
        const normalY = dy / distance;

        penetration = {
          x: normalX * overlap,
          y: normalY * overlap,
        };
      }
    }

    return { intersecting, penetration };
  }

  /**
   * Clear all colliders from the system
   */
  public clearColliders(): void {
    this.colliders.clear();
  }
}
