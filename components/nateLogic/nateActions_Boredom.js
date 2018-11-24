import { extensions as objEx, dew } from "tools/common";
import { extensions as numEx, randomBetween } from "tools/numbers";
import { extensions as arrEx } from "tools/array";
import { extensions as vecEx } from "tools/vectorMath";
import { extensions as maybe, nothing } from "tools/maybe";
import { behaviorModes, aimings, facings, movings, jumps } from './core';
import { randomTime, decrementTime } from './core';
import { isTargetReachable, playSound } from './nateCommon';
import chaseBehavior from "./nateBehavior_Chase";
import * as nc from "./nateConfig";

const { round, abs, random: randomNum } = Math;

const { behaviorFinalized, isFrustrated, handledMovement } = nc.lanes;
const { stationaryTargetBoredomThreshold, becomePassiveTime } = nc.timing;
const { start: stareStartValue, added: stareAddedValue } = nc.timing.stareTimes;
const { start: shortStartValue, added: shortAddedValue } = nc.timing.frustratedActions.shortTimes;
const { start: longStartValue, added: longAddedValue } = nc.timing.frustratedActions.longTimes;
const { stareAtOffset } = nc.ranges;
const { min: stareUpAngleMin, max: stareUpAngleMax } = nc.ranges.stareUpRange;
const { height: hbHeight, halfWidth: hbHalfWidth } = nc.hitbox;

const $$boredomBehavior = Symbol("nateActions_Boredom/boredomBehavior");
const $$beFrustrated = Symbol("nateActions_Boredom/boredomBehavior/beFrustrated");
const $$stomp = Symbol("nateActions_Boredom/boredomBehavior/beFrustrated/stomp");
const $$backAndForth = Symbol("nateActions_Boredom/boredomBehavior/beFrustrated/backAndForth");
const $$pretendNotToCare = Symbol("nateActions_Boredom/boredomBehavior/beFrustrated/pretendNotToCare");
const $$spazzOut = Symbol("nateActions_Boredom/boredomBehavior/beFrustrated/spazzOut");
const $$momentarilyAggressive = Symbol("nateActions_Boredom/boredomBehavior/beFrustrated/momentarilyAggressive");

// This behavior governs Nate's transition from aggressive to passive modes.
// When the cursor is not in a location he can attack it, or is too far away,
// he will grow frustrated, bored, and finally transition to his passive state.

function beingFrustrated(cursor, bounds) {
  if (cursor.msSinceUpdate >= stationaryTargetBoredomThreshold) return true;
  if (!isTargetReachable(cursor.relPos, bounds)) return true;
  return false;
}

export function qualificationFn(nate, {cursor, bounds}, {actions, lanes}) {
  if (lanes.has(behaviorFinalized)) return false;
  if (!beingFrustrated(cursor, bounds)) return false;

  const state = actions[$$boredomBehavior] ?? { boredomTimer: becomePassiveTime };
  
  nate.actions[$$boredomBehavior] = state;
  lanes.add(behaviorFinalized);
  return true;
}

function hasOverlap(left1, right1, left2, right2) {
  if (left1::numEx.inRange(left2, right2)) return true;
  if (right1::numEx.inRange(left2, right2)) return true;
  return false;
}

function shouldLookUp(natePos, cursorPos, flipX) {
  let { x: nx, y: ny } = natePos;
  ny += hbHeight;
  const v = cursorPos::objEx.copyOwn();
  v.x -= nx;
  v.y -= ny;
  if (flipX) v.x *= -1;
  return v::vecEx.angle()::numEx.angleInRange(stareUpAngleMin, stareUpAngleMax);
}

function facingTowardFarBounds(natePos, bounds) {
  const { left, right } = bounds;
  const width = right - left;
  const midPoint = bounds.left + (width * 0.5);
  return natePos.x::numEx.inRange(left, midPoint) ? facings.right : facings.left;
}

function didBumpEdge(natePos, facing, bounds) {
  const hbLeft = natePos.x - hbHalfWidth;
  const hbRight = natePos.x + hbHalfWidth;
  if (facing === facings.left && hbLeft <= bounds.left) return true;
  if (facing === facings.right && hbRight >= bounds.right) return true;
  return false;
}

const results = {
  notApplicable: Symbol("notApplicable"),
  continue: Symbol("continue"),
  done: Symbol("done")
};

const subActions = {
  stomp: (nate, _, {delta, actions}) => {
    const { physics: { onGround }, brain } = nate;
    const state = actions[$$stomp] ?? {
      actionTimer: randomTime(shortStartValue, shortAddedValue),
      jumpTimer: 0.0
    };

    if (onGround && state.actionTimer <= 0.0) return results.done;
    if (onGround) {
      if (state.jumpTimer > 0.0) 
        state.jumpTimer = decrementTime(state.jumpTimer, delta);
      else {
        brain.jumping = jumps.weak;
        state.jumpTimer = randomTime(50, 100);
      }
    }
    state.actionTimer = decrementTime(state.actionTimer, delta);

    nate.actions[$$stomp] = state;
    return results.continue;
  },

  backAndForth: (nate, {bounds}, {delta, actions}) => {
    const { physics: { pos: natePos }, brain } = nate;
    const state = actions[$$backAndForth] ?? {
      facing: facingTowardFarBounds(natePos, bounds),
      actionTimer: randomTime(shortStartValue, shortAddedValue),
      runTimer: randomTime(250, 500)
    };

    const doneWithAction = state.actionTimer <= 0.0;
    const doneWithRunning = state.runTimer <= 0.0 || didBumpEdge(natePos, state.facing, bounds);

    state.actionTimer = decrementTime(state.actionTimer, delta);
    state.runTimer = decrementTime(state.runTimer, delta);

    if (doneWithRunning) {
      if (!doneWithAction)
        state.facing = state.facing === facings.right ? facings.left : facings.right;
      state.runTimer = randomTime(250, 500);
    }

    brain.moving = movings.yes;
    brain.facing = state.facing;

    nate.actions[$$backAndForth] = state;

    return doneWithAction && doneWithRunning ? results.done : results.continue;
  },

  pretendNotToCare: (nate, {cursor, bounds}, {delta, actions}, frustrationState) => {
    if (frustrationState.pretendedNotToCare) return results.notApplicable;

    const { physics: { pos: natePos }, brain } = nate;
    const { relPos: cursorPos } = cursor;

    const horizDiff = cursorPos.x - natePos.x;

    const ownState = actions[$$pretendNotToCare] ?? {
      lastFacing: horizDiff >= 0.0 ? facings.left : facings.right,
      runTimer: randomTime(500, 500),
      waitTimer: randomTime(longStartValue, longAddedValue),
      repositionTimer: 0.0
    };

    if (ownState.runTimer > 0.0) {
      const bumpedEdge = didBumpEdge(natePos, ownState.lastFacing, bounds);
      if (!bumpedEdge) brain.moving = movings.yes;
      brain.facing = ownState.lastFacing;
      ownState.runTimer = bumpedEdge ? 0.0 : decrementTime(ownState.runTimer, delta);
    }
    else {
      const desiredFacing = horizDiff >= 0.0 ? facings.left : facings.right;
      if (desiredFacing !== ownState.lastFacing) {
        ownState.repositionTimer = randomTime(50, 150);
        ownState.lastFacing = desiredFacing;
      }
      if (ownState.repositionTimer <= 0.0)
        brain.facing = ownState.lastFacing;
      ownState.repositionTimer = decrementTime(ownState.repositionTimer, delta);
      ownState.waitTimer = decrementTime(ownState.waitTimer, delta);
    }

    nate.actions[$$pretendNotToCare] = ownState;

    if (ownState.waitTimer <= 0.0) {
      frustrationState.pretendedNotToCare = true;
      return results.done;
    }
    return results.continue;
  },

  spazzOut: (nate, _, {delta, actions}) => {

    const { physics: { onGround }, brain } = nate;

    const state = actions[$$spazzOut] ?? {
      jumpsRemaining: round(randomBetween(2, 4)),
      moveTimer: randomTime(32, 32)
    };

    if (onGround && state.jumpsRemaining === 0) return results.done;

    const switchFacing = state.moveTimer <= 0.0;
    state.moveTimer = decrementTime(state.moveTimer, delta);

    if (onGround) {
      brain.jumping = jumps.full;
      state.jumpsRemaining -= 1;
    }

    brain.shooting = dew(() => {
      const val = randomNum();
      if (val < 0.5) return aimings.ahead;
      if (val < 0.75) return aimings.up;
      if (!onGround) return aimings.down;
      return aimings.up;
    });

    brain.moving = movings.yes;

    if (switchFacing) {
      brain.facing = brain.facing === facings.right ? facings.left : facings.right;
      state.moveTimer = randomTime(32, 48);
    }

    nate.actions[$$spazzOut] = state;
    return results.continue;
  },

  momentarilyAggressive: (nate, world, listState) => {
    const { cursor, bounds } = world;
    const { delta, actions, lanes } = listState;

    if (!isTargetReachable(cursor.relPos, bounds)) return results.notApplicable;

    const state = actions[$$momentarilyAggressive] ?? {
      timer: randomTime(longStartValue, longAddedValue)
    };

    if (state.timer <= 0.0) return results.done;

    // A bit hacky, but the chase behavior won't run if this is set.
    lanes.delete(behaviorFinalized);
    chaseBehavior(nate, world, listState);
    state.timer = decrementTime(state.timer, delta);

    nate.actions[$$momentarilyAggressive] = state;
    return results.continue;
  }
};

function doSubAction(nate, world, listState, state) {
  // Continue an action, if it was requested.
  if (state.lastResult === results.continue && state.subAction::maybe.isDefined()) {
    state.lastResult = subActions[state.subAction](nate, world, listState, state);
    return;
  }

  // Find a new sub-action.
  const keys = Object.keys(subActions)::arrEx.shuffle();
  for (const key of keys) {
    const result = subActions[key](nate, world, listState, state);
    if (result !== results.notApplicable) {
      state.subAction = key;
      state.lastResult = result;
      return;
    }
  }

  // Fail and perform no action.
  state.subAction = nothing;
  state.lastResult = results.notApplicable;
}

export function beFrustrated(nate, world, listState) {
  const behaviorState = nate.actions[$$boredomBehavior];
  if (behaviorState.boredomTimer <= 0.0) return;

  const { delta, lanes, actions } = listState;

  if (lanes.has(handledMovement)) return;

  const state = actions[$$beFrustrated] ?? {
    inPosition: false,
    repositionTimer: 0.0,
    stareTimer: randomTime(stareStartValue, stareAddedValue),
    subAction: nothing,
    lastResult: results.notApplicable,
    pretendedNotToCare: false
  };

  const tryDoSubAction = state.inPosition && state.stareTimer <= 0.0;

  if (tryDoSubAction) {
    // Select a sub-action carry it out.
    doSubAction(nate, world, listState, state);
    // Reset the staring timer if we're not going to continue the action.
    if (state.lastResult !== results.continue)
      state.stareTimer = randomTime(stareStartValue, stareAddedValue);
  }

  if (!tryDoSubAction || state.lastResult === results.notApplicable) {
    // Determine and reach the desired position.
    const { physics: { pos: natePos }, brain } = nate;
    const { relPos: cursorPos } = world.cursor;
    const { left: boundsLeft, right: boundsRight } = world.bounds;
    const hbLeft = natePos.x - hbHalfWidth;
    const hbRight = natePos.x + hbHalfWidth;
    const cursorRangeLeft = (cursorPos.x - stareAtOffset)::numEx.clamp(boundsLeft, boundsRight);
    const cursorRangeRight = cursorPos.x + stareAtOffset::numEx.clamp(boundsLeft, boundsRight);
    
    const horizDiff = cursorPos.x - natePos.x;
    const repositionNow = state.repositionTimer <= 0.0;
    const inPosition = hasOverlap(hbLeft, hbRight, cursorRangeLeft, cursorRangeRight);
    const tooClose = abs(horizDiff) < stareAtOffset * 0.4;

    if (!inPosition) {
      if (repositionNow) {
        // Get into position.
        brain.facing = horizDiff >= 0.0 ? facings.right : facings.left;
        brain.moving = movings.yes;
      }
    }
    else if (tooClose) {
      if (repositionNow) {
        // Move so the cursor isn't as close.
        brain.facing = facingTowardFarBounds(natePos, world.bounds);
        brain.moving = movings.yes;
      }
    }
    else if (repositionNow) {
      // Stare.
      brain.facing = horizDiff >= 0.0 ? facings.right : facings.left;
      state.repositionTimer = randomTime(50, 150);
    }

    brain.lookingUp = shouldLookUp(natePos, cursorPos, brain.facing === facings.left);

    if (state.inPosition)
      state.stareTimer = decrementTime(state.stareTimer, delta);
    if (!repositionNow)
      state.repositionTimer = decrementTime(state.repositionTimer, delta);
    
    state.inPosition = state.inPosition || inPosition;
  }

  nate.actions[$$beFrustrated] = state;
  lanes.add(isFrustrated);
  lanes.add(handledMovement);
}

export function becomePassive(nate, _, {lanes}) {
  if (lanes.has(isFrustrated)) return;

  const { brain, sounds } = nate;
  playSound(nate, sounds.aroo);
  brain.behavior = behaviorModes.passive;
  brain.pacificationTimer = randomTime(2000.0, 1000.0);
}

export function decrementBoredomTimer(nate, _, {delta}) {
  const behaviorState = nate.actions[$$boredomBehavior];
  behaviorState.boredomTimer = decrementTime(behaviorState.boredomTimer, delta);
}