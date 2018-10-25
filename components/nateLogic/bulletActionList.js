import { dew, copyOwn } from "/tools/common";
import { map, sign } from "/tools/numbers";
import { sub, unit, angleBetween, rotate, add, mul, set, makeLength } from "/tools/vectorMath";
import { length as vLength }  from "/tools/vectorMath";
import { playSound } from "./nateCommon";
import { decrementTime } from "./core";
import * as bc from "./bulletConfig";

const { max, min, abs } = Math;

// Extract configuration.
const { lanes: { didInitialize, handledLogic } } = bc;
const { timings: { timeout, burstLifetime } } = bc;
const { ranges: { homing: { begin: homingRangeBegin, full: homingRangeFull } } } = bc;
const { ranges: { chaseDistance, maxDrift, fov } } = bc;
const { physics: { bulletVel, driftRemainingValue } } = bc;

/** Draws a node into its leader, so that it maintains a maximum distance. */
function doChase(leader, chaser, followDistance) {
  const direction = chaser::copyOwn()::sub(leader);
  const dist = direction::vLength();
  if (dist <= followDistance) return;

  direction::makeLength(followDistance)::add(leader);
  chaser::set(direction);
}

function initialize(bullet, {nate}, {lanes}) {
  if (!bullet.spawned) return;
  if (bullet.initialized) return;
  const { trajectory, sounds, nodePositions: [node1, node2, node3] } = bullet;

  trajectory::unit();
  node2::set(node1);
  node3::set(node1);
  bullet.driftRemaining = driftRemainingValue;
  bullet.timeout = timeout;
  bullet.burst = 0.0;
  bullet.initialized = true;

  playSound(nate, sounds.spawned);

  lanes.add(didInitialize);
}

function collideWithCursor(bullet, {cursor, nate}) {
  if (!bullet.spawned) return;
  if (bullet.burst > 0.0) return;

  const { sounds, nodePositions: [bulletPos] } = bullet;
  const distance = cursor.relPos::copyOwn()::sub(bulletPos)::vLength();

  if (distance > 4.0) return;

  bullet.timeout = 0.0;
  bullet.burst = burstLifetime;
  playSound(nate, sounds.hit);
}

function expire(bullet, {nate}, {delta, lanes}) {
  if (!bullet.spawned) return;
  if (lanes.has(didInitialize)) return;
  if (bullet.burst > 0.0) return;

  bullet.timeout = decrementTime(bullet.timeout, delta);
  if (bullet.timeout > 0.0) return;

  bullet.burst = burstLifetime;
  playSound(nate, bullet.sounds.timedOut);
}

function handleBurst(bullet, _, {delta, lanes}) {
  if (!bullet.spawned) return;
  if (lanes.has(didInitialize)) return;
  if (lanes.has(handledLogic)) return;
  if (bullet.burst <= 0.0) return;

  bullet.burst = decrementTime(bullet.burst, delta);
  if (bullet.burst <= 0.0)
    bullet.spawned = false;
  lanes.add(handledLogic);
}

function homeOnCursor(bullet, {cursor}, {delta, lanes}) {
  if (!bullet.spawned) return;
  if (lanes.has(didInitialize)) return;
  if (lanes.has(handledLogic)) return;
  if (bullet.driftRemaining <= 0.0) return;

  const { relPos: cursorPos } = cursor;
  const { trajectory, nodePositions: [bulletPos] } = bullet;
  const vector = cursorPos::copyOwn()::sub(bulletPos);
  const distance = vector::vLength();
  
  if (distance > homingRangeBegin) return;

  const driftAngle = dew(() => {
    const maxDriftAngle = min(maxDrift * delta, bullet.driftRemaining);
    const [angle, angleSign] = dew(() => {
      const angle = vector::angleBetween(trajectory);
      return [abs(angle), angle::sign()];
    });

    if (angle > fov * 0.5)
      return 0.0;
    if (distance <= homingRangeFull)
      return angleSign * min(angle, maxDriftAngle);
    
    // Falloff the homing strength based on distance.
    const nDist = distance - homingRangeFull;
    const powerScalar = nDist::map(homingRangeBegin - homingRangeFull, 0.0, 0.0, 1.0);
    return angleSign * min(angle * powerScalar, maxDriftAngle);
  });
  
  bullet.driftRemaining = max(bullet.driftRemaining - abs(driftAngle), 0.0);
  trajectory::rotate(driftAngle);
}

function flyAhead(bullet, _, {delta, lanes}) {
  if (!bullet.spawned) return;
  if (lanes.has(didInitialize)) return;
  if (lanes.has(handledLogic)) return;

  const { trajectory, nodePositions: [node1Pos, node2Pos, node3Pos] } = bullet;
  node1Pos::add(trajectory::copyOwn()::mul(bulletVel * delta));
  doChase(node1Pos, node2Pos, chaseDistance.node2);
  doChase(node2Pos, node3Pos, chaseDistance.node3);
  lanes.add(handledLogic);
}

export default Object.freeze([
  initialize,
  collideWithCursor,
  expire,
  handleBurst,
  homeOnCursor,
  flyAhead
]);