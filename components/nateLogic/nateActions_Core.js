import { extensions as objEx, dew } from "tools/common";
import { extensions as vecEx } from "tools/vectorMath";
import { extensions as maybe } from "tools/maybe";
import { decrementTime, stokesDrag } from "./core";
import { facings, aimings, movings, jumps, trajectories } from "./core";
import { playSound } from "./nateCommon";
import * as nc from "./nateConfig";

const { handledMovement } = nc.lanes;
const { friction, runAccel, jumpVel } = nc.physics;
const { halfWidth: hbHalfWidth } = nc.hitbox;
const { shootCoolDownValue, shootHoldValue, shootRecoilThreshold } = nc.timing;
const { shootOffsets } = nc;

const $$applyShootAnim = Symbol("nateActions_Core/applyShootAnim");

export function doSpawn(nate, {bounds}) {
  if (!nate.spawned) {
    const { physics: { pos } } = nate;
    const { left, right, ground } = bounds;
    pos.x = ((right - left) * 0.5) + left;
    pos.y = ground + 200;
    nate.spawned = true;
  }
}

export function runTimers({brain}, _, {delta}) {
  brain.retaliationTimer = decrementTime(brain.retaliationTimer, delta);
  brain.shootCoolDown = decrementTime(brain.shootCoolDown, delta);
  brain.shootHold = decrementTime(brain.shootHold, delta);
}

export function approachCursor(nate, {cursor, bounds}, {lanes}) {
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

export function doMove(nate) {
  const { brain, physics: { accel } } = nate;
  if (brain.moving !== movings.yes) return;
  const dir = brain.facing === facings.right ? 1.0 : -1.0;
  accel.x = dir * runAccel;
}

export function doJump(nate) {
  const { brain, physics } = nate;

  if (!physics.onGround) return;
  if (brain.jumping === jumps.none) return;

  physics.vel.y += brain.jumping === jumps.full ? jumpVel.full : jumpVel.weak;
  physics.onGround = false;
}

export function applyPhysics(nate, {bounds}, {delta}) {
  const { physics: { vel, accel, pos, onGround }, brain: { moving } } = nate;
  
  // Apply gravity.
  if (!onGround) accel.y -= 1 / 1000;

  // Apply x-axis drag if not drifting or unable to drift.
  if (moving !== movings.drift || onGround)
    vel.x = stokesDrag.newVelocity(accel.x * delta, friction * delta, vel.x);
  vel.y = vel.y + (accel.y * delta);
  pos.x += vel.x * delta;
  pos.y += vel.y * delta;

  // Acceleration is reset each frame.
  accel.x = accel.y = 0.0;

  // Keep Nate on the platform.
  if (pos.x - hbHalfWidth < bounds.left)
    pos.x = bounds.left + hbHalfWidth;
  if (pos.x + hbHalfWidth > bounds.right)
    pos.x = bounds.right - hbHalfWidth;
}

export function collideFloor(nate, { bounds: { ground } }) {
  const { physics, anim, sounds } = nate;
  const { vel, pos } = physics;
  if (pos.y < ground) {
    vel.y = 0.0;
    pos.y = ground;
    if (!physics.onGround) {
      physics.onGround = true;
      anim.land = 100.0;
      playSound(nate, sounds.land);
    }
  }
}

export function doShoot(nate, {bullets}) {
  const { brain, anim, physics } = nate;
  if (brain.shooting === aimings.none) return;
  if (brain.shootCoolDown > 0) return;

  const bullet = bullets.find((bullet) => !bullet.spawned);
  if (typeof bullet !== "undefined") {
    // If a shoot offset is defined for the current state of nate, shoot a bullet.
    shootOffsets(brain.shooting, nate)::maybe.forEach(({x: ox, y: oy}) => {
      const { x: px, y: py } = physics.pos;
      const dir = brain.shooting === aimings.ahead ? brain.facing : brain.shooting;
      if (brain.facing === facings.left) ox *= -1;

      brain.aiming = brain.shooting;
      brain.shootCoolDown = shootCoolDownValue;
      brain.shootHold = shootHoldValue;
      anim.recoil = true;

      bullet.spawned = true;
      bullet.initialized = false;
      bullet.nodePositions[0]::vecEx.setXY(px + ox, py + oy);
      bullet.trajectory = trajectories[dir]::objEx.copyOwn();
    });
  }
}

export function applyMainAnim(nate, _, {delta}) {
  const { physics: { vel, onGround }, brain: { moving, facing, lookingUp }, anim } = nate;
  const tags = [];

  if (!onGround) {
    tags.push("jump");
    if (vel.y < -55 / 1000) tags.push("fall");
    else if (vel.y < 55 / 1000) tags.push("apex");
  }
  else {
    if (moving === movings.yes) tags.push("run");
    else {
      tags.push("idle");
      if (lookingUp) tags.push("look-up");
    }
  }

  anim.land = decrementTime(anim.land, delta);
  if (anim.land > 0) {
    if (!tags.includes("idle")) anim.land = 0;
    else tags.push("land");
  }

  if (facing === facings.left) tags.push("mirror");

  anim.main = tags;
}

export function applyShootAnim(nate, _, {actions}) {
  const { brain: { aiming, shootHold }, anim } = nate;
  const state = actions[$$applyShootAnim] ?? { lastAiming: aimings.none };

  const tags = [];

  if (shootHold > 0.0 && aiming !== aimings.none) {
    if (aiming === aimings.ahead) tags.push("shoot-side");
    else if (aiming === aimings.up) tags.push("shoot-up");
    else if (aiming === aimings.down) tags.push("shoot-down");

    anim.recoil = dew(() => {
      if (!anim.recoil) return false;
      if (shootHold < shootRecoilThreshold) return false;
      if (aiming !== state.lastAiming) return false;
      if (!anim.main.includes("idle")) return false;
      return true;
    });

    if (anim.recoil) tags.push("recoil");
  }

  anim.shoot = tags;

  state.lastAiming = aiming;
  nate.actions[$$applyShootAnim] = state;
}

export function doReset({brain}) {
  brain.moving = movings.no;
  brain.lookingUp = false;
  brain.jumping = jumps.none;
  brain.shooting = aimings.none;
}