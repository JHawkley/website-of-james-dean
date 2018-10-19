import { dew, randomBetween } from "/tools/common";
import { inRange } from "/tools/numbers";
import { randomTime, decrementTime } from "./core";
import { facings, aimings, movings, jumps } from "./core";
import { bestAiming } from "./nateCommon";
import * as nc from "./nateConfig";

const { max, abs } = Math;

const { handledMovement, behaviorFinalized, didFlee, didAttack } = nc.lanes;
const { above: rangeAbove, below: rangeBelow, side: rangeSide } = nc.ranges.flee;
const { edgeFleeDistances, jumpOverDistance, comfortable: { max: comfortableRangeMax } } = nc.ranges;
const { bottom: bottomReach } = nc.ranges.sideReachableBounds;
const { halfWidth: hbHalfWidth, height: hbHeight } = nc.hitbox;
const { maxVel } = nc.physics;
const { retaliationWaitTime } = nc.timing;

const defaultState = Object.freeze({ until: 0.0, forced: false });

const $$fleeBehavior = Symbol("nateActions_Flee/fleeBehavior");
const $$fleeFromEdge = Symbol("nateActions_Flee/fleeFromEdge");
const $$fleeFromCursor = Symbol("nateActions_Flee/fleeFromCursor");
const $$retaliateJumpOver = Symbol("nateActions_Flee/retaliateJumpOver");
const $$retaliateBackFire = Symbol("nateActions_Flee/retaliateBackFire");

function calcFleeDist(bounds, {min: minDist, max: maxDist}) {
  const width = bounds.right - bounds.left;
  return max(randomBetween(minDist * width, maxDist * width), rangeSide);
}

export function qualificationFn(nate, {cursor}, {delta, actions, lanes}) {
  if (lanes.has(behaviorFinalized)) return false;

  const { physics: { pos: natePos } } = nate;
  const { relPos: cursorPos } = cursor;
  const horizDiff = cursorPos.x - natePos.x;
  const vertDiff = cursorPos.y - natePos.y;

  let { until: untilTimer, forced } = actions[$$fleeBehavior] ?? defaultState;
  untilTimer = decrementTime(untilTimer, delta);

  if (!forced && untilTimer <= 0.0) {
    if (vertDiff >= 0 && vertDiff > rangeAbove) return false;
    if (vertDiff < 0 && -vertDiff > rangeBelow) return false;
    if (abs(horizDiff) > rangeSide) return false;
  }

  const state = actions[$$fleeBehavior] ?? dew(() => {
    // Disable retaliation for the first few moments of fleeing.
    nate.brain.retaliationTimer = randomTime(250, retaliationWaitTime);
    return {
      horizDiff: 0.0,
      vertDiff: 0.0,
      until: 0.0,
      forced: false
    };
  });

  state.horizDiff = horizDiff;
  state.vertDiff = vertDiff;
  state.until = untilTimer > 0.0 ? untilTimer : randomTime(500.0, 500.0);
  state.forced = false;

  // This action-state will be used by sub-list actions.
  nate.actions[$$fleeBehavior] = state;
  lanes.add(behaviorFinalized);
  return true;
}

export function fleeFromEdge(nate, {bounds}, {actions, lanes}) {
  if (lanes.has(didFlee)) return;
  if (lanes.has(handledMovement)) return;

  const { physics: { pos }, brain } = nate;
  const distFromLeft = max(pos.x - hbHalfWidth - bounds.left, 0.0);
  const distFromRight = max(-1 * (pos.x + hbHalfWidth - bounds.right), 0.0);

  let state = actions[$$fleeFromEdge];

  if (typeof state === "undefined") {
    if (distFromLeft <= 0.0) {
      state = {
        edgeFleeDistance: calcFleeDist(bounds, edgeFleeDistances),
        edgeFleeFacing: facings.right
      };
    }
    else if (distFromRight <= 0.0) {
      state = {
        edgeFleeDistance: calcFleeDist(bounds, edgeFleeDistances),
        edgeFleeFacing: facings.left
      };
    }
    else return;
  }

  const { edgeFleeDistance, edgeFleeFacing } = state;
  switch (edgeFleeFacing) {
    case facings.right:
      if (distFromLeft >= edgeFleeDistance) return;
      brain.facing = edgeFleeFacing;
      brain.moving = movings.yes;
      break;
    case facings.left:
      if (distFromRight >= edgeFleeDistance) return;
      brain.facing = edgeFleeFacing;
      brain.moving = movings.yes;
      break;
  }

  nate.actions[$$fleeFromEdge] = state;
  lanes.add(didFlee);
  lanes.add(handledMovement);
}

export function fleeFromCursor(nate, _, {delta, actions, lanes}) {
  if (lanes.has(didFlee)) return;
  if (lanes.has(handledMovement)) return;

  const { brain } = nate;
  const { horizDiff } = nate.actions[$$fleeBehavior];
  const state = actions[$$fleeFromCursor] ?? {
    lastFacing: facings.left,
    holdTimer: 0.0
  };

  state.holdTimer = decrementTime(state.holdTimer, delta);
  
  brain.moving = movings.yes;
  brain.facing = dew(() => {
    if (state.holdTimer > 0.0)
      return state.lastFacing;

    const newFacing = horizDiff >= 0 ? facings.left : facings.right;
    state.lastFacing = newFacing;
    state.holdTimer = randomTime(75.0, 125.0);
    return newFacing;
  });

  nate.actions[$$fleeFromCursor] = state;
  lanes.add(didFlee);
  lanes.add(handledMovement);
}

export function retaliateShootUp(nate, {cursor}, {lanes}) {
  if (!lanes.has(didFlee)) return;
  if (lanes.has(didAttack)) return;

  const { brain, physics: { onGround } } = nate;
  const { vertDiff } = nate.actions[$$fleeBehavior];

  const doRetaliate = dew(() => {
    if (!onGround) return false;
    if (vertDiff <= hbHeight) return false;
    if (bestAiming(nate, cursor.relPos, false) !== aimings.up) return false;
    return true;
  });

  if (!doRetaliate) return false;

  brain.shooting = aimings.up;
  lanes.add(didAttack);
}

export function retaliateJumpOver(nate, {cursor}, {actions, lanes}) {
  if (!lanes.has(didFlee)) return;
  if (lanes.has(didAttack)) return;

  const { brain, physics: { onGround } } = nate;
  const { horizDiff, vertDiff } = nate.actions[$$fleeBehavior];
  const stillRetaliating = typeof actions[$$retaliateJumpOver] !== "undefined";

  const doRetaliate = dew(() => {
    if (stillRetaliating) return !onGround;
    if (!onGround) return false;
    if (brain.retaliationTimer > 0.0) return false;

    // Don't retaliate if the cursor is too far to jump over...
    if (abs(horizDiff) > jumpOverDistance) return false;

    // ...or if the cursor is too high or too low.
    if (!vertDiff::inRange(-comfortableRangeMax, hbHeight)) return false;

    // Retaliate if the cursor is touching his hitbox...
    if (abs(horizDiff) <= hbHalfWidth && horizDiff::inRange(0.0, hbHeight)) return true;

    // ...or if moving toward the cursor.
    if (horizDiff > 0.0 && brain.facing === facings.right) return true;
    if (horizDiff < 0.0 && brain.facing === facings.left) return true;

    return false;
  });

  if (!doRetaliate) {
    if (stillRetaliating)
      nate.brain.retaliationTimer = randomTime(250, retaliationWaitTime);
    return;
  }

  const state = actions[$$retaliateJumpOver] ?? {
    facing: brain.facing
  };

  if (onGround) {
    brain.jumping = jumps.full;
  }
  else {
    brain.facing = state.facing;
    brain.moving = movings.yes;
    const aiming = bestAiming(nate, cursor.relPos);
    if (aiming === aimings.down)
      brain.shooting = aiming;
  }

  // Force Nate to continue to flee until the retaliation completes.
  nate.actions[$$fleeBehavior].forced = true;

  nate.actions[$$retaliateJumpOver] = state;
  lanes.add(didAttack);
}

export function retaliateBackFire(nate, {bullets, cursor}, {actions, lanes}) {
  if (!lanes.has(didFlee)) return;
  if (lanes.has(didAttack)) return;

  const { brain, physics: { onGround, vel } } = nate;
  const { horizDiff, vertDiff } = nate.actions[$$fleeBehavior];
  const stillRetaliating = actions[$$retaliateBackFire] === true;

  const doRetaliate = dew(() => {
    if (stillRetaliating) return !onGround;
    if (!onGround) return false;
    if (brain.retaliationTimer > 0.0) return false;
    if (abs(vel.x) < maxVel * 0.9) return false;

    // Don't retaliate if we have too few bullets to make it worth it.
    const unspawnedCount = bullets.reduce((c, bullet) => c + (!bullet.spawned ? 1 : 0), 0);
    if (unspawnedCount < 2) return false;

    // Don't retaliate if the cursor is too low.
    if (vertDiff < bottomReach) return false;

    // Don't retaliate if the cursor is too close.
    if (abs(horizDiff) <= hbHalfWidth * 2) return false;

    // Retaliate if moving away from the cursor.
    if (horizDiff > 0.0 && brain.facing === facings.left) return true;
    if (horizDiff < 0.0 && brain.facing === facings.right) return true;
    return false;
  });

  if (!doRetaliate) {
    if (stillRetaliating)
      nate.brain.retaliationTimer = randomTime(250, retaliationWaitTime);
    return;
  }

  if (onGround) {
    brain.jumping = vertDiff >= 40.0 ? jumps.full : jumps.weak;
  }
  else {
    brain.facing = horizDiff >= 0.0 ? facings.right : facings.left;
    brain.moving = movings.drift;
    brain.shooting = bestAiming(nate, cursor.relPos);
  }

  // Force Nate to continue to flee until the retaliation completes.
  nate.actions[$$fleeBehavior].forced = true;

  nate.actions[$$retaliateBackFire] = true;
  lanes.add(didAttack);
}