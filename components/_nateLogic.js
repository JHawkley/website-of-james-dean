import { dew, copyOwn, randomBetween } from "/tools/common";
import { map, sign, inRange } from "/tools/numbers";
import { sub, unit, angleBetween, rotate, add, mul, set, setXY } from "/tools/vectorMath";
import { length as vLength }  from "/tools/vectorMath";
import { randomTime, decrementTime, stokesDrag, subList } from "./nateLogic/core";
import { directions, facings, aimings, movings, jumps, trajectories } from "./nateLogic/core";
import * as nc from "./nateLogic/nateConfig";
import * as bc from "./nateLogic/bulletConfig";

const { max, min, abs, random: randomNum } = Math;

const nateActionList = dew(() => {

  const {
    lanes: { handledMovement, behaviorFinalized, didFlee, didRetaliate },
    shootOffsets, bestAiming
  } = nc;

  const actions = {

    doSpawn(nate, {bounds}) {
      if (!nate.spawned) {
        const { physics: { pos } } = nate;
        const { left, right, ground } = bounds;
        pos.x = ((right - left) * 0.5) + left;
        pos.y = ground + 200;
        nate.spawned = true;
      }
    },

    runTimers({brain}, _, {delta}) {
      brain.retaliationTimer = decrementTime(brain.retaliationTimer, delta);
      brain.shootCoolDown = decrementTime(brain.shootCoolDown, delta);
      brain.shootHold = decrementTime(brain.shootHold, delta);
    },

    fleeBehavior: dew(() => {

      const defaultState = Object.freeze({ until: 0.0, forced: false });

      const calcFleeDist = (bounds, {min: minDist, max: maxDist}) => {
        const width = bounds.right - bounds.left;
        return max(randomBetween(minDist * width, maxDist * width), nc.ranges.flee.side);
      };

      function qualificationFn(nate, {cursor}, {delta, actions, lanes}) {
        if (lanes.has(behaviorFinalized)) return false;

        const { physics: { pos: natePos } } = nate;
        const { relPos: cursorPos } = cursor;
        const horizDiff = cursorPos.x - natePos.x;
        const vertDiff = cursorPos.y - natePos.y;

        let { until: untilTimer, forced } = actions["fleeBehavior"] ?? defaultState;
        untilTimer = decrementTime(untilTimer, delta);

        if (!forced && untilTimer <= 0.0) {
          if (vertDiff >= 0 && vertDiff > nc.ranges.flee.above) return false;
          if (vertDiff < 0 && -vertDiff > nc.ranges.flee.below) return false;
          if (abs(horizDiff) > nc.ranges.flee.side) return false;
        }

        const state = actions["fleeBehavior"] ?? dew(() => {
          // Disable retaliation for the first few moments of fleeing.
          nate.brain.retaliationTimer = randomTime(250, nc.timing.retaliationWaitTime);
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

        // Save this state into the active `actions` so actions in the sub-list can
        // make use of the data that it contains.
        actions["fleeBehavior"] = state;
        // But also save it into the future `nate.actions` as per-usual so the object
        // isn't reallocated next frame.
        nate.actions["fleeBehavior"] = state;

        lanes.add(behaviorFinalized);
        return true;
      }

      function fleeFromEdge(nate, {bounds}, {actions, lanes}) {
        if (lanes.has(didFlee)) return;
        if (lanes.has(handledMovement)) return;

        const { physics: { pos }, brain } = nate;
        const distFromLeft = max(pos.x - nc.hitbox.halfWidth - bounds.left, 0.0);
        const distFromRight = max(-1 * (pos.x + nc.hitbox.halfWidth - bounds.right), 0.0);

        let state = actions["fleeBehavior:fleeFromEdge"];

        if (typeof state === "undefined") {
          if (distFromLeft <= 0.0) {
            state = {
              edgeFleeDistance: calcFleeDist(bounds, nc.ranges.edgeFleeDistances),
              edgeFleeFacing: facings.right
            };
          }
          else if (distFromRight <= 0.0) {
            state = {
              edgeFleeDistance: calcFleeDist(bounds, nc.ranges.edgeFleeDistances),
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

        nate.actions["fleeBehavior:fleeFromEdge"] = state;
        lanes.add(didFlee);
        lanes.add(handledMovement);
      }

      function fleeFromCursor(nate, _, {delta, actions, lanes}) {
        if (lanes.has(didFlee)) return;
        if (lanes.has(handledMovement)) return;

        const { brain } = nate;
        const { horizDiff } = actions["fleeBehavior"];
        const state = actions["fleeBehavior:fleeFromCursor"] ?? {
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

        nate.actions["fleeBehavior:fleeFromCursor"] = state;
        lanes.add(didFlee);
        lanes.add(handledMovement);
      }

      function retaliateShootUp(nate, _, {actions, lanes}) {
        if (!lanes.has(didFlee)) return;
        if (lanes.has(didRetaliate)) return;

        const { brain, physics: { onGround } } = nate;
        const { horizDiff, vertDiff } = actions["fleeBehavior"];

        const doRetaliate = dew(() => {
          if (!onGround) return false;
          if (abs(horizDiff) > nc.hitbox.halfWidth * 2) return false;
          if (vertDiff <= nc.hitbox.height) return false;
          return true;
        });

        if (!doRetaliate) return false;

        brain.shooting = aimings.up;
        lanes.add(didRetaliate);
      }

      function retaliateJumpOver(nate, {cursor}, {actions, lanes}) {
        if (!lanes.has(didFlee)) return;
        if (lanes.has(didRetaliate)) return;

        const { brain, physics: { onGround } } = nate;
        const { horizDiff, vertDiff } = actions["fleeBehavior"];
        const stillRetaliating = typeof actions["fleeBehavior:retaliateJumpOver"] !== "undefined";

        const doRetaliate = dew(() => {
          if (stillRetaliating) return !onGround;
          if (!onGround) return false;
          if (brain.retaliationTimer > 0.0) return false;

          // Don't retaliate if the cursor is too far to jump over...
          if (abs(horizDiff) > nc.ranges.jumpOverDistance) return false;

          // ...or if the cursor is too high or too low.
          if (!vertDiff::inRange(-nc.ranges.comfortable.max, nc.hitbox.height)) return false;

          // Retaliate if the cursor is touching his hitbox...
          if (abs(horizDiff) <= nc.hitbox.halfWidth && horizDiff::inRange(0.0, nc.hitbox.height)) return true;

          // ...or if moving toward the cursor.
          if (horizDiff > 0.0 && brain.facing === facings.right) return true;
          if (horizDiff < 0.0 && brain.facing === facings.left) return true;

          return false;
        });

        if (!doRetaliate) {
          if (stillRetaliating)
            nate.brain.retaliationTimer = randomTime(250, nc.timing.retaliationWaitTime);
          return;
        }

        const state = actions["fleeBehavior:retaliateJumpOver"] ?? {
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
        nate.actions["fleeBehavior"].forced = true;

        nate.actions["fleeBehavior:retaliateJumpOver"] = state;
        lanes.add(didRetaliate);
      }

      function retaliateBackFire(nate, {bullets, cursor}, {actions, lanes}) {
        if (!lanes.has(didFlee)) return;
        if (lanes.has(didRetaliate)) return;

        const { brain, physics: { onGround, vel } } = nate;
        const { horizDiff, vertDiff } = actions["fleeBehavior"];
        const stillRetaliating = actions["fleeBehavior:retaliateBackFire"] === true;

        const doRetaliate = dew(() => {
          if (stillRetaliating) return !onGround;
          if (!onGround) return false;
          if (brain.retaliationTimer > 0.0) return false;
          if (abs(vel.x) < nc.physics.maxVel * 0.9) return false;

          // Don't retaliate if we have too few bullets to make it worth it.
          const unspawnedCount = bullets.reduce((c, bullet) => c + (!bullet.spawned ? 1 : 0), 0);
          if (unspawnedCount < 2) return false;

          // Don't retaliate if the cursor is too low.
          if (vertDiff < 15.0) return false;

          // Don't retaliate if the cursor is too close.
          if (abs(horizDiff) <= nc.hitbox.halfWidth * 2) return false;

          // Retaliate if moving away from the cursor.
          if (horizDiff > 0.0 && brain.facing === facings.left) return true;
          if (horizDiff < 0.0 && brain.facing === facings.right) return true;
          return false;
        });

        if (!doRetaliate) {
          if (stillRetaliating)
            nate.brain.retaliationTimer = randomTime(250, nc.timing.retaliationWaitTime);
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
        nate.actions["fleeBehavior"].forced = true;

        nate.actions["fleeBehavior:retaliateBackFire"] = true;
        lanes.add(didRetaliate);
      }

      return subList(qualificationFn, [
        fleeFromEdge,
        fleeFromCursor,
        retaliateShootUp,
        retaliateJumpOver,
        retaliateBackFire
      ]);
    }),

    debug_randomIdle(nate, _, {delta, actions, lanes}) {
      const state = actions["debug_randomIdle"] ?? dew(() => {
        const [waitingTime, doElseTime] = dew(() => {
          const time = randomTime(1000.0, 2000.0);
          return randomNum() > 0.5 ? [time, 0.0] : [0.0, time];
        });
        return { waiting: waitingTime, lookUp: false, doElse: doElseTime };
      });

      if (state.waiting > 0.0) {
        lanes.add(handledMovement);
        nate.brain.lookingUp = state.lookUp;
        state.waiting = decrementTime(state.waiting, delta);
        if (state.waiting <= 0.0)
          state.doElse = randomTime(1000.0, 2000.0);
      }
      else {
        state.doElse = decrementTime(state.doElse, delta);
        if (state.doElse <= 0.0) {
          state.waiting = randomTime(1000.0, 2000.0);
          state.lookUp = randomNum() > 0.75;
        }
      }

      nate.actions["debug_randomIdle"] = state;
    },

    debug_paceBackAndForth(nate, {bounds}, {lanes}) {
      if (lanes.has(handledMovement)) return;
      lanes.add(handledMovement);
      const { brain, physics: { pos } } = nate;
      if (pos.x - nc.hitbox.halfWidth <= bounds.left) brain.facing = facings.right;
      if (pos.x + nc.hitbox.halfWidth >= bounds.right) brain.facing = facings.left;
      brain.moving = movings.yes;
    },

    debug_randomJump(nate, _, {delta, actions}) {
      const { brain, physics } = nate;
      if (!physics.onGround) return;

      const state = actions["debug_randomJump"] ?? {
        nextJump: randomTime(500.0, 1500.0)
      };

      state.nextJump = decrementTime(state.nextJump, delta);
      if (state.nextJump > 0.0)
        nate.actions["debug_randomJump"] = state;
      else
        brain.jumping = randomNum() > 0.5 ? jumps.full : jumps.weak;
    },

    debug_randomShoot(nate, _, {delta, actions}) {
      const { brain } = nate;
      if (brain.shootCoolDown > 0) return;

      const state = actions["debug_randomShoot"] ?? {
        nextShoot: randomNum() > 0.5 ? 0.0 : randomNum() * 3000.0
      };

      state.nextShoot = decrementTime(state.nextShoot, delta);
      if (state.nextShoot <= 0.0) {
        brain.shooting = dew(() => {
          const val = randomNum();
          if (val < 0.5) return aimings.ahead;
          if (val < 0.75) return aimings.up;
          if (!nate.physics.onGround) return aimings.down;
          return aimings.up;
        });
      }

      nate.actions["debug_randomShoot"] = state;
    },

    doMove(nate) {
      const { brain, physics: { accel } } = nate;
      if (brain.moving !== movings.yes) return;
      const dir = brain.facing === facings.right ? 1.0 : -1.0;
      accel.x = dir * nc.physics.runAccel;
    },

    doJump(nate) {
      const { brain, physics } = nate;
      if (brain.jumping === jumps.none) return;
      physics.vel.y += brain.jumping === jumps.full ? nc.physics.jumpVelFull : nc.physics.jumpVelWeak;
      physics.onGround = false;
    },

    applyPhysics(nate, {bounds}, {delta}) {
      const { physics: { vel, accel, pos, onGround }, brain: { moving } } = nate;
      
      // Apply gravity.
      if (!onGround) accel.y -= 1 / 1000;

      // Apply x-axis drag if not drifting or unable to drift.
      if (moving !== movings.drift || onGround)
        vel.x = stokesDrag.newVelocity(accel.x * delta, nc.physics.friction * delta, vel.x);
      vel.y = vel.y + (accel.y * delta);
      pos.x += vel.x * delta;
      pos.y += vel.y * delta;

      // Acceleration is reset each frame.
      accel.x = accel.y = 0.0;

      // Keep Nate on the platform.
      if (pos.x - nc.hitbox.halfWidth < bounds.left)
        pos.x = bounds.left + nc.hitbox.halfWidth;
      if (pos.x + nc.hitbox.halfWidth > bounds.right)
        pos.x = bounds.right - nc.hitbox.halfWidth;
    },

    collideFloor(nate, {bounds: { ground } }) {
      const { physics, anim } = nate;
      const { vel, pos } = physics;
      if (pos.y < ground) {
        vel.y = 0.0;
        pos.y = ground;
        if (!physics.onGround) {
          physics.onGround = true;
          anim.land = 100.0;
        }
      }
    },

    doShoot(nate, {bullets}) {
      const { brain, anim, physics } = nate;
      if (brain.shooting === aimings.none) return;
      if (brain.shootCoolDown > 0) return;

      const bullet = bullets.find((bullet) => !bullet.spawned);
      if (typeof bullet !== "undefined") {
        // If a shoot offset is defined for the current state of nate, shoot a bullet.
        shootOffsets(brain.shooting, nate).forEach(({x: ox, y: oy}) => {
          const { x: px, y: py } = physics.pos;
          const dir = brain.shooting === aimings.ahead ? brain.facing : brain.shooting;
          if (brain.facing === facings.left) ox *= -1;

          brain.aiming = brain.shooting;
          brain.shootCoolDown = nc.timing.shootCoolDownValue;
          brain.shootHold = nc.timing.shootHoldValue;
          anim.recoil = true;

          bullet.spawned = true;
          bullet.initialized = false;
          bullet.nodePositions[0]::setXY(px + ox, py + oy);
          bullet.trajectory = trajectories[dir]::copyOwn();
        });
      }
    },

    applyMainAnim(nate, _, {delta}) {
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
    },

    applyShootAnim(nate) {
      const { brain: { aiming, shootHold }, anim } = nate;
      const state = actions["applyShootAnim"] ?? { lastAiming: aimings.none };

      const tags = [];

      if (shootHold > 0.0 && aiming !== aimings.none) {
        if (aiming === aimings.ahead) tags.push("shoot-side");
        else if (aiming === aimings.up) tags.push("shoot-up");
        else if (aiming === aimings.down) tags.push("shoot-down");

        anim.recoil = dew(() => {
          if (!anim.recoil) return false;
          if (shootHold < nc.timing.shootRecoilThreshold) return false;
          if (aiming !== state.lastAiming) return false;
          if (!anim.main.includes("idle")) return false;
          return true;
        });

        if (anim.recoil) tags.push("recoil");
      }

      anim.shoot = tags;

      state.lastAiming = aiming;
      nate.actions["applyShootAnim"] = state;
    },

    doReset({brain}) {
      brain.moving = movings.no;
      brain.lookingUp = false;
      brain.jumping = jumps.none;
      brain.shooting = aimings.none;
    }
  }

  return Object.freeze([
    actions.doSpawn,
    actions.runTimers,
    actions.fleeBehavior,
    // Chase Behavior
    //actions.debug_randomIdle,
    //actions.debug_paceBackAndForth,
    //actions.debug_randomJump,
    //actions.debug_randomShoot,
    actions.doMove,
    actions.doJump,
    actions.applyPhysics,
    actions.collideFloor,
    actions.doShoot,
    actions.applyMainAnim,
    actions.applyShootAnim,
    actions.doReset
  ]);
});

const bulletActionList = dew(() => {

  const { lanes: { handledLogic, didInitialize }, doChase } = bc;

  const actions = {

    initialize(bullet, _, {lanes}) {
      if (!bullet.spawned) return;
      if (bullet.initialized) return;
      const { trajectory, nodePositions: [node1, node2, node3] } = bullet;

      trajectory::unit();
      node2::set(node1);
      node3::set(node1);
      bullet.driftRemaining = bc.physics.driftRemainingValue;
      bullet.timeout = bc.timings.timeout;
      bullet.burst = 0.0;
      bullet.initialized = true;
      lanes.add(didInitialize);
    },

    collideWithCursor(bullet, {cursor}) {
      if (!bullet.spawned) return;
      if (bullet.burst > 0.0) return;

      const { nodePositions: [bulletPos] } = bullet;
      const distance = cursor.relPos::copyOwn()::sub(bulletPos)::vLength();

      if (distance <= 4.0) {
        bullet.timeout = 0.0;
        bullet.burst = bc.timings.burstLifetime;
      }
    },

    expire(bullet, _, {delta, lanes}) {
      if (!bullet.spawned) return;
      if (lanes.has(didInitialize)) return;
      if (bullet.burst > 0.0) return;

      bullet.timeout = decrementTime(bullet.timeout, delta);
      if (bullet.timeout <= 0.0)
        bullet.burst = bc.timings.burstLifetime;
    },

    handleBurst(bullet, _, {delta, lanes}) {
      if (!bullet.spawned) return;
      if (lanes.has(didInitialize)) return;
      if (lanes.has(handledLogic)) return;
      if (bullet.burst <= 0.0) return;

      bullet.burst = decrementTime(bullet.burst, delta);
      if (bullet.burst <= 0.0)
        bullet.spawned = false;
      lanes.add(handledLogic);
    },

    homeOnCursor(bullet, {cursor}, {delta, lanes}) {
      if (!bullet.spawned) return;
      if (lanes.has(didInitialize)) return;
      if (lanes.has(handledLogic)) return;
      if (bullet.driftRemaining <= 0.0) return;

      const { relPos: cursorPos } = cursor;
      const { trajectory, nodePositions: [bulletPos] } = bullet;
      const vector = cursorPos::copyOwn()::sub(bulletPos);
      const distance = vector::vLength();
      
      if (distance > bc.ranges.homing.begin) return;

      const driftAngle = dew(() => {
        const maxDriftAngle = min(bc.ranges.maxDrift * delta, bullet.driftRemaining);
        const [angle, angleSign] = dew(() => {
          const angle = vector::angleBetween(trajectory);
          return [abs(angle), angle::sign()];
        });

        if (angle > bc.ranges.fov * 0.5)
          return 0.0;
        if (distance <= bc.ranges.homing.full)
          return angleSign * min(angle, maxDriftAngle);
        // Falloff the homing strength based on distance.
        const nDist = distance - bc.ranges.homing.full;
        const powerScalar = nDist::map(bc.ranges.homing.begin - bc.ranges.homing.full, 0.0, 0.0, 1.0);
        return angleSign * min(angle * powerScalar, maxDriftAngle);
      });
      
      bullet.driftRemaining = max(bullet.driftRemaining - abs(driftAngle), 0.0);
      trajectory::rotate(driftAngle);
    },

    flyAhead(bullet, _, {delta, lanes}) {
      if (!bullet.spawned) return;
      if (lanes.has(didInitialize)) return;
      if (lanes.has(handledLogic)) return;

      const { trajectory, nodePositions: [node1Pos, node2Pos, node3Pos] } = bullet;
      node1Pos::add(trajectory::copyOwn()::mul(bc.physics.bulletVel * delta));
      doChase(node1Pos, node2Pos, bc.ranges.chaseDistance.node2);
      doChase(node2Pos, node3Pos, bc.ranges.chaseDistance.node3);
      lanes.add(handledLogic);
    }

  };

  return Object.freeze([
    actions.initialize,
    actions.collideWithCursor,
    actions.expire,
    actions.handleBurst,
    actions.homeOnCursor,
    actions.flyAhead
  ]);
});

export { directions, facings, aimings, movings, jumps };
export { nateActionList, bulletActionList };