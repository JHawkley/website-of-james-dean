import { stokesDrag, aimings, movings } from "./core";
import { dew } from "/tools/common";
import maybe from "/tools/maybe";

/** Symbols identifying lanes in the action-list. */
export const lanes = {
  handledMovement: Symbol("handledMovement"),
  behaviorFinalized: Symbol("behaviorFinalized"),
  didFlee: Symbol("didFlee"),
  didAttack: Symbol("didAttack")
};

const maxVel = 130 / 1000;
const friction = stokesDrag.solveFriction(250);
const runAccel = stokesDrag.solveAccel(friction, maxVel);

export const physics = {
  /** The maximum velocity that Nate can typically run at. */
  maxVel,
  /** The amount of friction to apply to reach and hold `maxVel`. */
  friction,
  /** The acceleration to apply when Nate runs. */
  runAccel,
  /** The velocities to apply for each type of jump. */
  jumpVel: { weak: 275 / 1000, full: 375 / 1000 },
  /**
   * Based on above numbers, this is how high Nate should be able to reach, relative to ground level.
   * If the above numbers change, make sure this value is updated.
   */
  jumpHeight: { weak: 35, full: 67 }
};

export const hitbox = {
  /** The half-width of the hitbox. */
  halfWidth: 7,
  /** The height of the hitbox. */
  height: 42
};

// The upper-most limit that Nate can achieve.
const topPhysicalLimits = physics.jumpHeight.full + hitbox.height;

export const ranges = {
  /** The distances that Nate will consider the cursor too close, based on direction. */
  flee: { side: 100, above: topPhysicalLimits, below: 24 },
  /** The "comfortable" firing range for the cursor to be. */
  comfortable: { min: 150, max: 300 },
  /** The maximum distance out-of-bounds the cursor may be before being considered unreachable. */
  maxTargetDistance: 400,
  /** When the cursor is off to the side, it will be considered out of bounds if not in these vertical bounds. */
  sideReachableBounds: { bottom: 15, top: topPhysicalLimits },
  /** The percentage of the bounds that Nate will travel when being chased from an edge. */
  edgeFleeDistances: { min: 0.1, max: 0.2 },
  /** The number of pixels above or below Nate's hand he will consider close-enough to fire. */
  firingField: 15,
  /** The maximum distance the cursor should be when intending to jump over it. */
  jumpOverDistance: 50
};

export const timing = {
  /** The amount of time between shots. */
  shootCoolDownValue: 200,
  /** The amount of time Nate will hold up his hand after a shot. */
  shootHoldValue: 500,
  /** When `shootHold` is below this value, `recoil` will be cleared if it is `true`. */
  shootRecoilThreshold: 300,
  /**
   * The amount of additional time that should pass before attempting to retaliate against
   * the cursor again when fleeing.
   */
  retaliationWaitTime: 1000
};

/**
 * The offsets from Nate's position that bullets should shoot from.
 * This assumes a right facing, so negate the `x` component if the facing is left.
 * 
 * @param {Symbol} aiming The desired aiming to fire by.
 * @param {*} nate Nate's current state.
 * @returns {Array<{ x: number, y: number }>} An array, that may contain a single element holding the offset.
 */
export const shootOffsets = dew(() => {
  const lock = (obj) => maybe.one(Object.freeze(obj));
  const offsets = Object.freeze([
    lock({ x: 18, y: 27 }), // ahead + in-air
    lock({ x: 20, y: 24 }), // ahead + running
    lock({ x: 18, y: 25 }), // ahead + idle
    lock({ x: 9, y: 45 }),  // up + in-air
    lock({ x: 11, y: 42 }), // up + running
    lock({ x: 8, y: 43 }),  // up + idle
    lock({ x: 10, y: 18 })  // down + in-air
  ]);

  return (aiming, nate) => {
    const { brain: { moving }, physics: { onGround } } = nate;
    if (aiming === aimings.ahead) {
      if (!onGround) return offsets[0];
      if (moving === movings.yes) return offsets[1];
      return offsets[2];
    }
    if (aiming === aimings.up) {
      if (!onGround) return offsets[3];
      if (moving === movings.yes) return offsets[4];
      return offsets[5];
    }
    if (aiming === aimings.down && !onGround)
      return offsets[6];
    return maybe.nothing;
  };
});