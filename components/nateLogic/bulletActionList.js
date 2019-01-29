import { extensions as objEx, dew } from "tools/common";
import { extensions as numEx } from "tools/numbers";
import { extensions as vecEx } from "tools/vectorMath";
import { decrementTime, tracks } from "./core";
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
  const direction = chaser::objEx.copyOwn()::vecEx.sub(leader);
  const dist = direction::vecEx.length();
  if (dist <= followDistance) return;

  direction::vecEx.makeLength(followDistance)::vecEx.add(leader);
  chaser::vecEx.set(direction);
}

function initialize(bullet, world, {lanes}) {
  if (!bullet.spawned) return;
  if (bullet.initialized) return;
  const { trajectory, sounds, nodes: [node1, node2, node3] } = bullet;

  trajectory::vecEx.unit();
  node2.pos::vecEx.set(node1.pos);
  node3.pos::vecEx.set(node1.pos);
  bullet.driftRemaining = driftRemainingValue;
  bullet.timeout = timeout;
  bullet.burst = 0.0;
  bullet.initialized = true;

  sounds[tracks.spawned].play();

  lanes.add(didInitialize);
}

function collideWithCursor(bullet, {cursor}) {
  if (!bullet.spawned) return;
  if (bullet.burst > 0.0) return;

  const { sounds, nodes: [{ pos: bulletPos }] } = bullet;
  const distance = cursor.relPos::objEx.copyOwn()::vecEx.sub(bulletPos)::vecEx.length();

  if (distance > 4.0) return;

  bullet.timeout = 0.0;
  bullet.burst = burstLifetime;
  sounds[tracks.hit].play();
}

function expire(bullet, world, {delta, lanes}) {
  if (!bullet.spawned) return;
  if (lanes.has(didInitialize)) return;
  if (bullet.burst > 0.0) return;

  bullet.timeout = decrementTime(bullet.timeout, delta);
  if (bullet.timeout > 0.0) return;

  bullet.burst = burstLifetime;
  bullet.sounds[tracks.timedOut].play();
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
  const { trajectory, nodes: [{ pos: bulletPos }] } = bullet;
  const vector = cursorPos::objEx.copyOwn()::vecEx.sub(bulletPos);
  const distance = vector::vecEx.length();
  
  if (distance > homingRangeBegin) return;

  const driftAngle = dew(() => {
    const maxDriftAngle = min(maxDrift * delta, bullet.driftRemaining);
    const [angle, angleSign] = dew(() => {
      const angle = vector::vecEx.angleBetween(trajectory);
      return [abs(angle), angle::numEx.sign()];
    });

    if (angle > fov * 0.5)
      return 0.0;
    if (distance <= homingRangeFull)
      return angleSign * min(angle, maxDriftAngle);
    
    // Falloff the homing strength based on distance.
    const nDist = distance - homingRangeFull;
    const powerScalar = nDist::numEx.map(homingRangeBegin - homingRangeFull, 0.0, 0.0, 1.0);
    return angleSign * min(angle * powerScalar, maxDriftAngle);
  });
  
  bullet.driftRemaining = max(bullet.driftRemaining - abs(driftAngle), 0.0);
  trajectory::vecEx.rotate(driftAngle);
}

function flyAhead(bullet, _, {delta, lanes}) {
  if (!bullet.spawned) return;
  if (lanes.has(didInitialize)) return;
  if (lanes.has(handledLogic)) return;

  const { trajectory, nodes: [node1, node2, node3] } = bullet;
  node1.pos::vecEx.add(trajectory::objEx.copyOwn()::vecEx.mul(bulletVel * delta));
  doChase(node1.pos, node2.pos, chaseDistance.node2);
  doChase(node2.pos, node3.pos, chaseDistance.node3);
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