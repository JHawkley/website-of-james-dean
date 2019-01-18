import { extensions as maybe } from "tools/maybe";
import { extensions as numEx } from "tools/numbers";
import { behaviorModes, aimings, facings, jumps } from "./core";
import { decrementTime, randomTime } from "./core";
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
  if (shootOffset::maybe.isDefined()) {
    const {x: ox, y: oy} = shootOffset;
    const xd = horizDiff - ox;
    const yd = vertDiff - oy;
    if (yd <= 0.0 && abs(xd) <= (-yd)::numEx.clamp(firingField))
      return aimings.down;
  }

  shootOffset = shootOffsets(aimings.up, nate);
  if (shootOffset::maybe.isDefined()) {
    const {x: ox, y: oy} = shootOffset;
    const xd = horizDiff - ox;
    const yd = vertDiff - oy;
    if (yd >= 0.0 && abs(xd) <= yd::numEx.clamp(firingField))
      return aimings.up;
  }

  shootOffset = shootOffsets(aimings.ahead, nate);
  if (shootOffset::maybe.isDefined()) {
    const {x: ox, y: oy} = shootOffset;
    const xd = horizDiff - ox;
    const yd = vertDiff - oy;
    if (xd >= 0.0 && abs(yd) <= xd::numEx.clamp(firingField))
      return aimings.ahead;
  }

  return aimings.none;
}

/**
 * Determines if the target is in a location that can be attacked from the side, potentially with a jump.
 *
 * @export
 * @param {{x: number, y: number}} target The target's position.
 * @param {{left: number, right: number, ground: number}} bounds The traversable bounds.
 * @returns {boolean} Whether the target is in a location that can be attacked from the side.
 */
export function isTargetReachableHorizontally(target, bounds) {
  const { x, y } = target;
  const { left: boundsLeft, right: boundsRight, ground: groundLevel } = bounds;

  const reachLeft = boundsLeft - maxTargetDistance;
  const reachRight = boundsRight + maxTargetDistance;

  if (x::numEx.inRange(reachLeft, reachRight))
    if (y::numEx.inRange(reachBottom + groundLevel, reachTop + groundLevel))
      return true;
  
  return false;
}

/**
 * Determines if the target is in a location that can be attacked from above or below.
 *
 * @export
 * @param {{x: number, y: number}} target The target's position.
 * @param {{left: number, right: number}} bounds The traversable bounds.
 * @returns {boolean} Whether the target is in a location that can be attacked from above or below.
 */
export function isTargetReachableVertically(target, bounds) {
  const { x, y } = target;
  const { left: boundsLeft, right: boundsRight } = bounds;

  if (y::numEx.inRange(-maxTargetDistance, maxTargetDistance))
    if (x::numEx.inRange(boundsLeft, boundsRight))
      return true;
  
  return false;
}

/**
 * Determines if the target is in a location where bullets are able to hit.
 *
 * @export
 * @param {{x: number, y: number}} target The target's position.
 * @param {{left: number, right: number, ground: number}} bounds The traversable bounds.
 * @returns {boolean} Whether the target is in a location that can be attacked.
 */
export function isTargetReachable(target, bounds) {
  if (isTargetReachableHorizontally(target, bounds)) return true;
  if (isTargetReachableVertically(target, bounds)) return true;
  return false;
}

/**
 * Makes an action that has Nate perform a jump at some random interval.
 *
 * @export
 * @param {*} minTime The minimum time between jumps.
 * @param {*} addedTime An amount of additional time that may be randomly added between jumps.
 * @param {string} [symbolName="nateCommon/randomJump"] A name for the symbol representing the action's state.
 * @returns {(nate: *, world: *, listState: *) => void} An action function.
 */
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

/**
 * Plays the given sound, if sound is enabled and Nate is in his aggressive behavior.
 *
 * @export
 * @param {*} nate Nate's current state.
 * @param {*} sound The React reference for the `audio` element to play.
 */
export function playSound(nate, sound) {
  if (!nc.sound.enabled) return;
  if (nate.brain.behavior !== behaviorModes.aggressive) return;
  sound.current?.play();
}