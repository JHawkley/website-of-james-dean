import { dew, copyOwn } from "/tools/common";
import { angleInRange } from "/tools/numbers";
import { angle, length as vLength } from "/tools/vectorMath";
import { behaviorModes, facings, aimings, decrementTime, subList } from "./core";
import { isTargetReachable } from './nateCommon';
import * as actions from "./nateActions_Debug";
import * as nc from "./nateConfig";

const { behaviorFinalized } = nc.lanes;
const { height: hbHeight } = nc.hitbox;
const { maxTargetDistance, sightFOV } = nc.ranges;
const { stationaryTargetBoredomThreshold } = nc.timing;

function qualificationFn(nate) {
  return nate.brain.behavior === behaviorModes.passive;
}

function passifying(nate, _, {delta, lanes}) {
  const { brain } = nate;

  if (brain.pacificationTimer <= 0.0) return;

  brain.pacificationTimer = decrementTime(brain.pacificationTimer, delta);
  lanes.add(behaviorFinalized);
}

function getFaceAiming(nate) {
  const { brain: { lookingUp, aiming } } = nate;
  if (aiming !== aimings.none) return aiming;
  if (lookingUp) return aimings.up;
  return aimings.ahead;
}

function getCursorData(natePos, cursorPos, flipX) {
  let { x: nx, y: ny } = natePos;
  ny += hbHeight;
  const v = cursorPos::copyOwn();
  v.x -= nx;
  v.y -= ny;
  if (flipX) v.x *= -1;
  return [v::vLength(), v::angle()];
}

function lookForCursor(nate, {bounds, cursor}, {lanes}) {
  if (lanes.has(behaviorFinalized)) return;

  const { physics: { pos: natePos }, brain } = nate;
  const { relPos: cursorPos } = cursor;

  if (cursor.msSinceUpdate >= stationaryTargetBoredomThreshold) return;
  if (!isTargetReachable(cursorPos, bounds)) return;

  const faceAiming = getFaceAiming(nate);
  const [cursorDistance, cursorAngle] = getCursorData(natePos, cursorPos, brain.facing === facings.left);

  if (cursorDistance > maxTargetDistance) return;

  const {min, max} = sightFOV[faceAiming];
  const inSight = cursorAngle::angleInRange(min, max);

  if (!inSight) return;

  brain.behavior = behaviorModes.aggressive;
}

const passiveBehavior = dew(() => {
  function qualificationFn(nate, world, {lanes}) {
    if (lanes.has(behaviorFinalized)) return false;
    if (nate.brain.behavior !== behaviorModes.passive) return false;

    lanes.add(behaviorFinalized);
    return true;
  }

  return subList(qualificationFn, [
    actions.randomIdle,
    actions.paceBackAndForth,
    actions.randomJump,
    actions.randomShoot
  ]);
});

export default subList(qualificationFn, [
  passifying,
  lookForCursor,
  passiveBehavior
]);