import { isNotEmpty } from "/tools/maybe";
import { clamp, inRange } from "/tools/numbers";
import { aimings, facings, jumps, decrementTime, randomTime } from "./core";
import * as nc from "./nateConfig";

const { abs, random: randomNum } = Math;
const { shootOffsets } = nc;
const { firingField, maxTargetDistance } = nc.ranges;
const { sideReachableBounds: { bottom: reachBottom, top: reachTop } } = nc.ranges;

/**
 * Determines the best direction to aim to hit the `target`.  Returns `aimings.none` if `considerCooldown` is
 * `true` and Nate is still on his shoot cooldown.
 *
 * @param {*} nate Nate's current state.
 * @param {{ x: number, y: number }} target The position of the target.
 * @param {boolean} [considerCooldown=true] Whether the `shootCooldown` should be considered.
 * @returns {Symbol} An aiming; may be `none` if no aiming is suitable.
 */
export function bestAiming(nate, target, considerCooldown = true) {
  const { physics: { pos: natePos }, brain: { facing, shootCoolDown } } = nate;

  if (considerCooldown && shootCoolDown > 0.0) return aimings.none;

  const horizDiff = (target.x - natePos.x) * (facing === facings.left ? -1 : 1);
  const vertDiff = target.y - natePos.y;
  let shootOffset;

  shootOffset = shootOffsets(aimings.down, nate);
  if (shootOffset::isNotEmpty()) {
    const [{x: ox, y: oy}] = shootOffset;
    const xd = horizDiff - ox;
    const yd = vertDiff - oy;
    if (yd <= 0.0 && abs(xd) <= (-yd)::clamp(firingField))
      return aimings.down;
  }

  shootOffset = shootOffsets(aimings.up, nate);
  if (shootOffset::isNotEmpty()) {
    const [{x: ox, y: oy}] = shootOffset;
    const xd = horizDiff - ox;
    const yd = vertDiff - oy;
    if (yd >= 0.0 && abs(xd) <= yd::clamp(firingField))
      return aimings.up;
  }

  shootOffset = shootOffsets(aimings.ahead, nate);
  if (shootOffset::isNotEmpty()) {
    const [{x: ox, y: oy}] = shootOffset;
    const xd = horizDiff - ox;
    const yd = vertDiff - oy;
    if (xd >= 0.0 && abs(yd) <= xd::clamp(firingField))
      return aimings.ahead;
  }

  return aimings.none;
}

/**
 * Determines if the target is in a location where bullets are able to hit.
 *
 * @export
 * @param {{x: number, y: number}} target The target's position.
 * @param {{left: number, right: number}} bounds The traversable bounds.
 * @returns {boolean} Whether the target is in a location that can be attacked.
 */
export function isTargetReachable(target, bounds) {
  const { x, y } = target;
  const {left: boundsLeft, right: boundsRight, ground: groundLevel } = bounds;

  const reachLeft = boundsLeft - maxTargetDistance;
  const reachRight = boundsRight + maxTargetDistance;

  // Can the target be attacked from the side, potentially with a jump?
  if (x::inRange(reachLeft, reachRight))
    if (y::inRange(reachBottom + groundLevel, reachTop + groundLevel))
      return true;

  // Can the target be attacked form above and below?
  if (y::inRange(-maxTargetDistance, maxTargetDistance))
    if (x::inRange(boundsLeft, boundsRight))
      return true;
  
  return false;
}

export function makeRandomJump(minTime, addedTime, symbolName = "nateCommon/randomJump") {

  const $$randomJump = Symbol(symbolName);

  return (nate, _, {delta, actions}) => {
    const { brain, physics } = nate;
    if (!physics.onGround) return;
  
    const state = actions[$$randomJump] ?? {
      nextJump: randomTime(minTime, addedTime)
    };
  
    state.nextJump = decrementTime(state.nextJump, delta);
    if (state.nextJump > 0.0)
      nate.actions[$$randomJump] = state;
    else
      brain.jumping = randomNum() > 0.5 ? jumps.full : jumps.weak;
  }

}