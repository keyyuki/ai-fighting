/**
 * CollisionSystem.spec.ts
 * Unit tests for the CollisionSystem class
 */
import {
  CollisionSystem,
  ColliderType,
  CollisionData,
  CollisionRect,
  CollisionCircle,
} from "./CollisionSystem";

describe("CollisionSystem", () => {
  let collisionSystem: CollisionSystem;

  beforeEach(() => {
    collisionSystem = new CollisionSystem();
  });

  test("should register and retrieve colliders", () => {
    // Create a test collider
    const testCollider: CollisionData = {
      id: "hitbox-1",
      owner: "player1",
      type: ColliderType.HITBOX,
      shape: { x: 0, y: 0, width: 50, height: 50 },
      active: true,
      damage: 10,
    };

    // Register the collider
    collisionSystem.registerCollider(testCollider);

    // Get active HITBOX colliders
    const hitboxes = collisionSystem.getActiveColliders(ColliderType.HITBOX);

    // Verify the collider is in the result
    expect(hitboxes).toHaveLength(1);
    expect(hitboxes[0]).toEqual(testCollider);
  });

  test("should detect rectangle-rectangle collision", () => {
    // Create two overlapping rectangles
    const hitbox: CollisionData = {
      id: "hitbox-1",
      owner: "player1",
      type: ColliderType.HITBOX,
      shape: { x: 0, y: 0, width: 50, height: 50 },
      active: true,
    };

    const hurtbox: CollisionData = {
      id: "hurtbox-1",
      owner: "player2",
      type: ColliderType.HURTBOX,
      shape: { x: 25, y: 25, width: 50, height: 50 },
      active: true,
    };

    // Register the colliders
    collisionSystem.registerCollider(hitbox);
    collisionSystem.registerCollider(hurtbox);

    // Check collisions
    const results = collisionSystem.checkAllCollisions();

    // Verify results
    expect(results.length).toBe(1);
    expect(results[0].intersecting).toBe(true);
    expect(results[0].colliderA).toEqual(hitbox);
    expect(results[0].colliderB).toEqual(hurtbox);
    expect(results[0].penetration).toBeDefined();
  });

  test("should detect circle-circle collision", () => {
    // Create two overlapping circles
    const hitbox: CollisionData = {
      id: "hitbox-2",
      owner: "player1",
      type: ColliderType.HITBOX,
      shape: { x: 0, y: 0, radius: 30 } as CollisionCircle,
      active: true,
    };

    const hurtbox: CollisionData = {
      id: "hurtbox-2",
      owner: "player2",
      type: ColliderType.HURTBOX,
      shape: { x: 40, y: 0, radius: 20 } as CollisionCircle,
      active: true,
    };

    // Register the colliders
    collisionSystem.registerCollider(hitbox);
    collisionSystem.registerCollider(hurtbox);

    // Check collisions
    const results = collisionSystem.checkAllCollisions();

    // Verify results
    expect(results.length).toBe(1);
    expect(results[0].intersecting).toBe(true);
    expect(results[0].colliderA).toEqual(hitbox);
    expect(results[0].colliderB).toEqual(hurtbox);
    expect(results[0].penetration).toBeDefined();
  });

  test("should detect rectangle-circle collision", () => {
    // Create overlapping rectangle and circle
    const hitbox: CollisionData = {
      id: "hitbox-3",
      owner: "player1",
      type: ColliderType.HITBOX,
      shape: { x: 0, y: 0, width: 50, height: 50 } as CollisionRect,
      active: true,
    };

    const hurtbox: CollisionData = {
      id: "hurtbox-3",
      owner: "player2",
      type: ColliderType.HURTBOX,
      shape: { x: 40, y: 40, radius: 20 } as CollisionCircle,
      active: true,
    };

    // Register the colliders
    collisionSystem.registerCollider(hitbox);
    collisionSystem.registerCollider(hurtbox);

    // Check collisions
    const results = collisionSystem.checkAllCollisions();

    // Verify results
    expect(results.length).toBe(1);
    expect(results[0].intersecting).toBe(true);
  });

  test("should not detect collision between non-overlapping shapes", () => {
    // Create non-overlapping shapes
    const hitbox: CollisionData = {
      id: "hitbox-4",
      owner: "player1",
      type: ColliderType.HITBOX,
      shape: { x: 0, y: 0, width: 50, height: 50 },
      active: true,
    };

    const hurtbox: CollisionData = {
      id: "hurtbox-4",
      owner: "player2",
      type: ColliderType.HURTBOX,
      shape: { x: 100, y: 100, width: 50, height: 50 },
      active: true,
    };

    // Register the colliders
    collisionSystem.registerCollider(hitbox);
    collisionSystem.registerCollider(hurtbox);

    // Check collisions
    const results = collisionSystem.checkAllCollisions();

    // Verify no collisions detected
    expect(results.length).toBe(0);
  });

  test("should ignore inactive colliders", () => {
    // Create overlapping shapes but one is inactive
    const hitbox: CollisionData = {
      id: "hitbox-5",
      owner: "player1",
      type: ColliderType.HITBOX,
      shape: { x: 0, y: 0, width: 50, height: 50 },
      active: false, // Inactive!
    };

    const hurtbox: CollisionData = {
      id: "hurtbox-5",
      owner: "player2",
      type: ColliderType.HURTBOX,
      shape: { x: 25, y: 25, width: 50, height: 50 },
      active: true,
    };

    // Register the colliders
    collisionSystem.registerCollider(hitbox);
    collisionSystem.registerCollider(hurtbox);

    // Check collisions
    const results = collisionSystem.checkAllCollisions();

    // Verify no collisions detected due to inactive collider
    expect(results.length).toBe(0);
  });

  test("should ignore collisions between same owner", () => {
    // Create overlapping shapes with the same owner
    const hitbox: CollisionData = {
      id: "hitbox-6",
      owner: "player1",
      type: ColliderType.HITBOX,
      shape: { x: 0, y: 0, width: 50, height: 50 },
      active: true,
    };

    const hurtbox: CollisionData = {
      id: "hurtbox-6",
      owner: "player1", // Same owner!
      type: ColliderType.HURTBOX,
      shape: { x: 25, y: 25, width: 50, height: 50 },
      active: true,
    };

    // Register the colliders
    collisionSystem.registerCollider(hitbox);
    collisionSystem.registerCollider(hurtbox);

    // Check collisions
    const results = collisionSystem.checkAllCollisions();

    // Verify no collisions detected due to same owner
    expect(results.length).toBe(0);
  });

  test("should update a collider", () => {
    // Create a test collider
    const testCollider: CollisionData = {
      id: "hitbox-7",
      owner: "player1",
      type: ColliderType.HITBOX,
      shape: { x: 0, y: 0, width: 50, height: 50 },
      active: true,
      damage: 10,
    };

    // Register the collider
    collisionSystem.registerCollider(testCollider);

    // Update the collider
    collisionSystem.updateCollider("hitbox-7", {
      shape: { x: 100, y: 100, width: 50, height: 50 },
      damage: 20,
    });

    // Get active HITBOX colliders
    const hitboxes = collisionSystem.getActiveColliders(ColliderType.HITBOX);

    // Verify the collider was updated
    expect(hitboxes).toHaveLength(1);
    expect(hitboxes[0].damage).toBe(20);
    expect((hitboxes[0].shape as CollisionRect).x).toBe(100);
  });

  test("should remove a collider", () => {
    // Create a test collider
    const testCollider: CollisionData = {
      id: "hitbox-8",
      owner: "player1",
      type: ColliderType.HITBOX,
      shape: { x: 0, y: 0, width: 50, height: 50 },
      active: true,
    };

    // Register the collider
    collisionSystem.registerCollider(testCollider);

    // Remove the collider
    collisionSystem.removeCollider("hitbox-8");

    // Get active HITBOX colliders
    const hitboxes = collisionSystem.getActiveColliders(ColliderType.HITBOX);

    // Verify the collider was removed
    expect(hitboxes).toHaveLength(0);
  });

  test("should activate and deactivate a collider", () => {
    // Create a test collider (active by default)
    const testCollider: CollisionData = {
      id: "hitbox-9",
      owner: "player1",
      type: ColliderType.HITBOX,
      shape: { x: 0, y: 0, width: 50, height: 50 },
      active: true,
    };

    // Register the collider
    collisionSystem.registerCollider(testCollider);

    // Deactivate the collider
    collisionSystem.setColliderActive("hitbox-9", false);

    // Get active HITBOX colliders
    let hitboxes = collisionSystem.getActiveColliders(ColliderType.HITBOX);

    // Verify no active colliders
    expect(hitboxes).toHaveLength(0);

    // Activate the collider
    collisionSystem.setColliderActive("hitbox-9", true);

    // Get active HITBOX colliders again
    hitboxes = collisionSystem.getActiveColliders(ColliderType.HITBOX);

    // Verify one active collider
    expect(hitboxes).toHaveLength(1);
  });
});
