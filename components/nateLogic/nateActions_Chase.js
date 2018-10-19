import { dew, randomBetween } from "/tools/common";
import { inRange } from "/tools/numbers";
import { aimings, facings, movings, jumps } from './core';
import { randomTime, decrementTime, subList } from './core';
import { bestAiming, isTargetReachable, makeRandomJump } from './nateCommon';
import * as nc from "./nateConfig";

const { min, max, abs } = Math;

const { behaviorFinalized, handledMovement, didAttack } = nc.lanes;
const { halfWidth: hbHalfWidth } = nc.hitbox;
const { jumpOverDistance, comfortable: comfortableRange } = nc.ranges;

const attackFromBelowHeight = dew(() => {
  const { above: willFleeBelow } = nc.ranges.flee;
  const { top: isUnreachableAbove } = nc.ranges.sideReachableBounds;
  return max(willFleeBelow, isUnreachableAbove);
});

const { below: willFleeAbove } = nc.ranges.flee;
const { bottom: minSideReachable } = nc.ranges.sideReachableBounds;

const $$shootFromBelow = Symbol("nateActions_Chase/shootFromBelow");
const $$approachToShootUp = Symbol("nateActions_Chase/shootFromBelow/approachToShootUp");
const $$passOverCursor = Symbol("nateActions_Chase/shootFromAbove/passOverCursor");
const $$stayComfortable = Symbol("nateActions_Chase/comfortableShooting/stayComfortable");
const $$takeShots = Symbol("nateActions_Chase/comfortableShooting/takeShots");

function approach(nate, {cursor, bounds}, {lanes}) {
  if (lanes.has(handledMovement)) return;

  const { physics: { pos: natePos }, brain } = nate;
  
  const hbLeft = natePos.x - hbHalfWidth;
  const hbRight = natePos.x + hbHalfWidth;

  const horizDiff = cursor.relPos.x - natePos.x;
  const newFacing = horizDiff >= 0 ? facings.right : facings.left;

  // Stop if touching the edge of the bounds.
  if (newFacing === facings.left && hbLeft <= bounds.left) return;
  if (newFacing === facings.right && hbRight >= bounds.right) return;
  
  brain.facing = newFacing;
  brain.moving = movings.yes;

  lanes.add(handledMovement);
}

export function qualificationFn(_, {cursor, bounds}, {lanes}) {
  if (lanes.has(behaviorFinalized)) return false;
  if (!isTargetReachable(cursor.relPos, bounds)) return false;
  
  lanes.add(behaviorFinalized);
  return true;
}

export const shootFromBelow = dew(() => {

  function qualificationFn(nate, {cursor, bounds}, {actions, lanes}) {
    if (lanes.has(didAttack)) return false;

    const { relPos: cursorPos } = cursor;
    const {left: boundsLeft, right: boundsRight, ground: groundLevel } = bounds;
    
    if (cursorPos.y <= attackFromBelowHeight + groundLevel) return false;
    if (!cursorPos.x::inRange(boundsLeft, boundsRight)) return false;

    const state = actions[$$shootFromBelow] ?? { doShooting: false };
    state.doShooting = bestAiming(nate, cursor.relPos, false) === aimings.up;

    // This action-state will be used by sub-list actions.
    nate.actions[$$shootFromBelow] = state;
    lanes.add(didAttack);
    return true;
  }

  function approachToShootUp(nate, world, listState) {
    const { actions, delta } = listState;
    const { brain } = nate;

    // Look up at the target.
    brain.lookingUp = true;

    const state = actions[$$approachToShootUp] ?? { retargetTimer: 0.0, didShoot: false };

    if (nate.actions[$$shootFromBelow].doShooting) {
      // If we have line-of-sight, stop so Nate can shoot.
      // Calculate a random retargetting lag to add some fallibility to Nate's movements.
      if (!state.didShoot)
        state.retargetTimer = randomTime(50.0, 300.0);
      state.didShoot = true;
    }
    else {
      // Only approach the target if the time needed to retarget has lapsed.
      if (state.retargetTimer <= 0.0)
        approach(nate, world, listState);
      
      state.retargetTimer = decrementTime(state.retargetTimer, delta);
      state.didShoot = false;
    }

    nate.actions[$$approachToShootUp] = state;
  }

  function shootUp(nate) {
    const { brain } = nate;
    if (!nate.actions[$$shootFromBelow].doShooting) return;
    if (brain.shootCoolDown > 0.0) return;
    brain.shooting = aimings.up;
  }

  const randomJump = makeRandomJump(0.0, 1000.0, "nateActions_Chase/randomJumpRefined");

  function randomJumpRefined(nate, world, listState) {
    const { cursor: { relPos: cursorPos }, bounds: { ground: groundLevel } } = world;
    if (!nate.actions[$$shootFromBelow].doShooting) return;
    if (cursorPos.y - groundLevel <= attackFromBelowHeight * 2.0) return;
    randomJump(nate, world, listState);
  }

  return subList(qualificationFn, [approachToShootUp, shootUp, randomJumpRefined]);
});

export const shootFromAbove = dew(() => {

  function qualificationFn(_, {cursor, bounds}, {lanes}) {
    if (lanes.has(didAttack)) return false;

    const { relPos: cursorPos } = cursor;
    const {left: boundsLeft, right: boundsRight, ground: groundLevel } = bounds;
    
    // Make sure we only attack if it won't cause us to flee.
    if (cursorPos.y >= groundLevel - willFleeAbove) return false;
    if (!cursorPos.x::inRange(boundsLeft, boundsRight)) return false;

    lanes.add(didAttack);
    return true;
  }

  function jumpOver(nate, {cursor}) {
    const { physics: { onGround, pos: natePos }, brain } = nate;
    const { relPos: cursorPos } = cursor;
    const horizDiff = cursorPos.x - natePos.x;

    if (!onGround) return;
    if (abs(horizDiff) >= jumpOverDistance) return;
    if (horizDiff >= 0.0 && brain.facing !== facings.right) return;
    if (horizDiff < 0.0 && brain.facing !== facings.left) return;

    brain.jumping = jumps.full;
  }

  function shootDown(nate, {cursor}) {
    const { brain } = nate;
    const { relPos: cursorPos } = cursor;

    if (bestAiming(nate, cursorPos) === aimings.down)
      brain.shooting = aimings.down;
  }

  // Define some states for a state machine.
  const passOverStates = Object.freeze({
    approaching: Symbol("approaching"),
    jumping: Symbol("jumping"),
    runOff: Symbol("runOff")
  });

  function passOverCursor(nate, world, listState) {
    const { physics: { onGround, pos: natePos }, brain } = nate;
    const { bounds } = world;
    const { delta, lanes } = listState;

    if (lanes.has(handledMovement)) return;

    const state = listState.actions[$$passOverCursor] ?? {
      curState: passOverStates.approaching,
      runOffTimer: 0.0
    }

    switch(state.curState) {
      case passOverStates.approaching:
        if (!onGround) state.curState = passOverStates.jumping;
        else approach(nate, world, listState);
        break;
      case passOverStates.jumping:
        brain.moving = movings.yes;
        if (onGround) {
          state.curState = passOverStates.runOff;
          state.runOffTimer = randomTime(0.0, 150.0);
        }
        break;
      case passOverStates.runOff:
        state.curState = dew(() => {
          const hbLeft = natePos.x - hbHalfWidth;
          const hbRight = natePos.x + hbHalfWidth;

          // Reset if touching the edge of the bounds.
          if (hbLeft <= bounds.left) return passOverStates.approaching;
          if (hbRight >= bounds.right) return passOverStates.approaching;
          // Reset if the run-off timer is complete.
          if (state.runOffTimer <= 0.0) return passOverStates.approaching;

          state.runOffTimer = decrementTime(state.runOffTimer, delta);
          brain.moving = movings.yes;
          return passOverStates.runOff;
        });
        break;
    }

    nate.actions[$$passOverCursor] = state;
    lanes.add(handledMovement);
  }

  return subList(qualificationFn, [jumpOver, shootDown, passOverCursor]);
});

export const comfortableShooting = dew(() => {

  function leftComfortableZone(tx, bounds, forced) {
    const minRange = tx - comfortableRange.max;
    const maxRange = tx - comfortableRange.min;
    if (forced || maxRange >= bounds.left)
      return [max(minRange, bounds.left), max(maxRange, bounds.left)];
    return void 0;
  }

  function rightComfortableZone(tx, bounds, forced) {
    const minRange = tx + comfortableRange.min;
    const maxRange = tx + comfortableRange.max;
    if (forced || minRange <= bounds.right)
      return [min(minRange, bounds.right), min(maxRange, bounds.right)];
    return void 0;
  }

  function mostComfortableZone(natePos, target, bounds) {
    // Try to calculate a comfortable range.
    // Nate prefers a range that is on the same side of the target as himself.
    // But it is possible that that can't happen, due to being pushed to the bounds.
    // In that case, we'll provide the opposite comfort zone and deal with it later.
    const { x: nx } = natePos;
    const { x: tx } = target;
    if (nx >= tx)
      return rightComfortableZone(tx, bounds, false) ?? leftComfortableZone(tx, bounds, true);
    return leftComfortableZone(tx, bounds, false) ?? rightComfortableZone(tx, bounds, true);
  }

  function qualificationFn(nate, world, {lanes}) {
    if (lanes.has(didAttack)) return false;
    lanes.add(didAttack);
    return true;
  }

  function stayComfortable(nate, {bounds, cursor}, {actions, lanes}) {
    if (lanes.has(handledMovement)) return;

    const { physics: { pos: natePos }, brain } = nate;
    const { relPos: cursorPos } = cursor;
    const [minRange, maxRange] = mostComfortableZone(natePos, cursorPos, bounds);

    const state = actions[$$stayComfortable] ?? { chosenSpot: randomBetween(minRange, maxRange) };

    if (!state.chosenSpot::inRange(minRange, maxRange))
      state.chosenSpot = randomBetween(minRange, maxRange);

    const shootFacing = cursorPos.x > natePos.x ? facings.right : facings.left;

    const tryToMove = dew(() => {
      const hbLeft = natePos.x - hbHalfWidth;
      const hbRight = natePos.x + hbHalfWidth;
      // Don't move if we're in position.
      if (state.chosenSpot::inRange(hbLeft, hbRight)) return false;
      // Don't move if we'd have to cross the cursor in order to reach our chosen spot.
      if (cursorPos.x::inRange(natePos.x, state.chosenSpot)) return false;
      // Don't move if we're up against the edge and chasing after the cursor.
      if (shootFacing === facings.left && hbLeft <= bounds.left) return;
      if (shootFacing === facings.right && hbRight >= bounds.right) return;
      // Otherwise, get into position.
      return true;
    });

    if (!tryToMove)
      brain.facing = shootFacing;
    else {
      brain.facing = state.chosenSpot > natePos.x ? facings.right : facings.left;
      brain.moving = movings.yes;
    }

    nate.actions[$$stayComfortable] = state;
    lanes.add(handledMovement);
  }
  
  function takeShots(nate, {cursor, bounds}, {delta, actions}) {
    const { physics: { pos: natePos, onGround }, brain } = nate;
    const { relPos: cursorPos } = cursor;
    const { ground: groundLevel } = bounds;
    const facingToShoot = cursorPos.x > natePos.x ? facings.right : facings.left;

    if (facingToShoot !== brain.facing) return;

    const state = actions[$$takeShots] ?? { jumpTimer: 0.0 };
    const aiming = bestAiming(nate, cursorPos, false);

    if (aiming !== aimings.none) {
      if (brain.shootCoolDown <= 0.0)
        brain.shooting = aiming;
    }
    else if (onGround) {
      state.jumpTimer = decrementTime(state.jumpTimer, delta);
      if (state.jumpTimer <= 0.0 && cursorPos.y >= minSideReachable + groundLevel) {
        const vertDiff = cursorPos.y - natePos.y;
        brain.jumping = vertDiff >= 50.0 ? jumps.full : jumps.weak;
        state.jumpTimer = randomTime(50.0, 200.0);
      }
    }

    nate.actions[$$takeShots] = state;
  }

  return subList(qualificationFn, [stayComfortable, takeShots]);
});