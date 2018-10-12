import { toRadians } from "/tools/numbers";

/** Symbols identifying lanes in the action-list. */
export const lanes = {
  handledLogic: Symbol("handledLogic"),
  didInitialize: Symbol("didInitialize")
};

const homingRange = 100.0;

export const ranges = {
  /** The ranges at which homing begins and when it has full power. */
  homing: { begin: homingRange, full: homingRange * 0.25 },
  /** The field-of-view of the bullet; the cursor must be in view to home. */
  fov: 120.0::toRadians(),
  /** The maximum amount the bullet can turn, per millisecond. */
  maxDrift: 150.0::toRadians() / 1000,
  /** The maximum distance that each node of the bullet allow from its leader. */
  chaseDistance: { node2: 3, node3: 3 }
};

export const physics = {
  /** The velocity of a bullet. */
  bulletVel: 450 / 1000,
  /** The maximum amount a bullet can turn in its life-time. */
  driftRemainingValue: 60.0::toRadians()
}

export const timings = {
  /** The amount of time a bullet has before expiring. */
  timeout: 1000,
  /** The amount of time the burst will remain before the bullet despawns. */
  burstLifetime: 150
}