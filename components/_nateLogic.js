import maybe from "../tools/maybe";
import { dew, copy, randomBetween } from "../tools/common";
import { toRadians, map, sign } from "../tools/numbers";
import { sub, unit, angleBetween, rotate, add, mul, set, setXY, makeLength } from "../tools/vectorMath";
import { length as vLength }  from "../tools/vectorMath";

const { max, min, abs, random: randomNum } = Math;

const randomTime = (start, added) => start + (randomNum() * added);
const decrementTime = (time, delta) => max(0.0, time - delta);

const stokesDrag = {
  solveFriction: (tMax) => 5 / tMax,
  solveAccel: (f, vMax) => f * vMax,
  newVelocity: (a, f, v) => v + (a - f * v)
};

const directions = Object.freeze({
  up: Symbol("up"),
  right: Symbol("right"),
  down: Symbol("down"),
  left: Symbol("left")
});

const facings = Object.freeze({
  right: directions.right,
  left: directions.left
});

const aimings = Object.freeze({
  ahead: Symbol("ahead"),
  up: directions.up,
  down: directions.down,
  none: Symbol("none")
});

const jumps = Object.freeze({
  full: Symbol("full"),
  weak: Symbol("weak"),
  none: Symbol("none")
});

const subList = (qualificationFn, actionList) => {
  return (object, world, listState) => {
    if (qualificationFn(object, world, listState))
      actionList.forEach(action => action(object, world, listState));
  };
};

const trajectories = Object.freeze({
  [directions.up]: Object.freeze({ x: 0.0, y: 1.0 }),
  [directions.right]: Object.freeze({ x: 1.0, y: 0.0 }),
  [directions.down]: Object.freeze({ x: 0.0, y: -1.0 }),
  [directions.left]: Object.freeze({ x: -1.0, y: 0.0 }),
});

const nateActionList = dew(() => {
  const handledMovement = Symbol("handledMovement");
  const behaviorFinalized = Symbol("behaviorFinalized");
  const didFlee = Symbol("didFlee");

  const fleeRanges = { side: 100, above: 100, below: 40 };
  const edgeFleeDistances = { min: 0.1, max: 0.2 };

  const hBoxHalfWidth = 7;
  const friction = stokesDrag.solveFriction(250);
  const runAccel = stokesDrag.solveAccel(friction, 130 / 1000);
  const jumpVelFull = 375 / 1000;
  const jumpVelWeak = 275 / 1000;

  const shootCoolDownValue = 200;
  const shootHoldValue = 500;
  const shootRecoilThreshold = 300;

  // The offsets from Nate's position that bullets should shoot from.
  // This assumes a right facing, so negate the `x` component if the facing is left.
  const shootOffsets = (aiming, nate) => {
    const { brain: { moving }, physics: { onGround } } = nate;
    if (aiming === aimings.ahead) {
      if (!onGround) return [{ x: 18, y: 27 }];
      if (moving) return [{ x: 20, y: 24 }];
      return [{ x: 18, y: 25 }];
    }
    if (aiming === aimings.up) {
      if (!onGround) return [{ x: 9, y: 45 }];
      if (moving) return [{ x: 11, y: 42 }];
      return [{ x: 8, y: 43 }];
    }
    if (aiming === aimings.down && !onGround)
      return [{ x: 10, y: 18 }];
    return maybe.nothing;
  };

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
      brain.shootCoolDown = decrementTime(brain.shootCoolDown, delta);
      brain.shootHold = decrementTime(brain.shootHold, delta);
    },

    fleeBehavior: dew(() => {

      const calcFleeDist = (bounds, {min: minDist, max: maxDist}) => {
        const width = bounds.right - bounds.left;
        return randomBetween(minDist * width, maxDist * width);
      };

      function qualificationFn(nate, {cursor}, {delta, actions, lanes}) {
        if (lanes.has(behaviorFinalized)) return false;

        const { physics: { pos: natePos } } = nate;
        const { relPos: cursorPos } = cursor;
        const horizDiff = cursorPos.x - natePos.x;
        const vertDiff = cursorPos.y - natePos.y;

        const untilTimer = decrementTime(actions["fleeBehavior"]?.until ?? 0.0, delta);

        if (untilTimer <= 0.0) {
          if (vertDiff >= 0 && vertDiff > fleeRanges.above) return false;
          if (vertDiff < 0 && -vertDiff > fleeRanges.below) return false;
          if (abs(horizDiff) > fleeRanges.side) return false;
        }

        const state = actions["fleeBehavior"] ?? {
          horizDiff: 0.0,
          vertDiff: 0.0,
          until: 0.0
        };

        state.horizDiff = horizDiff;
        state.vertDiff = vertDiff;
        state.until = untilTimer > 0.0 ? untilTimer : randomTime(500.0, 500.0);

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
        const distFromLeft = max(pos.x - hBoxHalfWidth - bounds.left, 0.0);
        const distFromRight = max(-1 * (pos.x + hBoxHalfWidth - bounds.right), 0.0);

        let state = actions["fleeBehavior:fleeFromEdge"];

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
            brain.moving = true;
            break;
          case facings.left:
            if (distFromRight >= edgeFleeDistance) return;
            brain.facing = edgeFleeFacing;
            brain.moving = true;
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
        
        brain.moving = true;
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

      return subList(qualificationFn, [
        fleeFromEdge,
        fleeFromCursor
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
      if (pos.x - hBoxHalfWidth <= bounds.left) brain.facing = facings.right;
      if (pos.x + hBoxHalfWidth >= bounds.right) brain.facing = facings.left;
      brain.moving = true;
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
      if (!brain.moving) return;
      const dir = brain.facing === facings.right ? 1.0 : -1.0;
      accel.x = dir * runAccel;
    },

    doJump(nate) {
      const { brain, physics } = nate;
      if (brain.jumping === jumps.none) return;
      physics.vel.y += brain.jumping === jumps.full ? jumpVelFull : jumpVelWeak;
      physics.onGround = false;
    },

    applyPhysics(nate, {bounds}, {delta}) {
      const { physics: { vel, accel, pos, onGround } } = nate;
      
      // Apply gravity.
      if (!onGround) accel.y -= 1 / 1000;

      vel.x = stokesDrag.newVelocity(accel.x * delta, friction * delta, vel.x);
      vel.y = vel.y + (accel.y * delta);
      pos.x += vel.x * delta;
      pos.y += vel.y * delta;

      // Acceleration is reset each frame.
      accel.x = accel.y = 0.0;

      // Keep Nate on the platform.
      if (pos.x - hBoxHalfWidth < bounds.left)
        pos.x = bounds.left + hBoxHalfWidth;
      if (pos.x + hBoxHalfWidth > bounds.right)
        pos.x = bounds.right - hBoxHalfWidth;
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
          brain.shootCoolDown = shootCoolDownValue;
          brain.shootHold = shootHoldValue;
          anim.recoil = true;

          bullet.spawned = true;
          bullet.initialized = false;
          bullet.nodePositions[0]::setXY(px + ox, py + oy);
          bullet.trajectory = trajectories[dir]::copy();
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
        if (moving) tags.push("run");
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
          if (shootHold < shootRecoilThreshold) return false;
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
      brain.moving = false;
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
  const handledLogic = Symbol("handledLogic");
  const didInitialize = Symbol("didInitialize");

  const homingRange = 100.0;
  const fullHomingRadius = homingRange * 0.25;
  const maxHomingAngle = 45.0::toRadians();
  const maxDrift = 150.0::toRadians() / 1000;
  const driftRemainingValue = 60.0::toRadians();

  const bulletVel = 450 / 1000;
  const timeoutValue = 1200;
  const burstLifetime = 150;

  const chaseDistNode2 = 3;
  const chaseDistNode3 = 3;

  const doChase = (leader, chaser, followDistance) => {
    const direction = chaser::copy()::sub(leader);
    const dist = direction::vLength();
    if (dist <= followDistance) return;

    direction::makeLength(followDistance)::add(leader);
    chaser::set(direction);
  };

  const actions = {

    initialize(bullet, _, {lanes}) {
      if (!bullet.spawned) return;
      if (bullet.initialized) return;
      const { trajectory, nodePositions: [node1, node2, node3] } = bullet;

      trajectory::unit();
      node2::set(node1);
      node3::set(node1);
      bullet.driftRemaining = driftRemainingValue;
      bullet.timeout = timeoutValue;
      bullet.burst = 0.0;
      bullet.initialized = true;
      lanes.add(didInitialize);
    },

    collideWithCursor(bullet, {cursor}) {
      if (!bullet.spawned) return;
      if (bullet.burst > 0.0) return;

      const { nodePositions: [bulletPos] } = bullet;
      const distance = cursor.relPos::copy()::sub(bulletPos)::vLength();

      if (distance <= 4.0) {
        bullet.timeout = 0.0;
        bullet.burst = burstLifetime;
      }
    },

    expire(bullet, _, {delta, lanes}) {
      if (!bullet.spawned) return;
      if (lanes.has(didInitialize)) return;
      if (bullet.burst > 0.0) return;

      bullet.timeout = decrementTime(bullet.timeout, delta);
      if (bullet.timeout <= 0.0)
        bullet.burst = burstLifetime;
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
      const vector = cursorPos::copy()::sub(bulletPos);
      const distance = vector::vLength();
      
      if (distance > homingRange) return;

      const driftAngle = dew(() => {
        const maxDriftAngle = min(maxDrift * delta, bullet.driftRemaining);
        const [angle, angleSign] = dew(() => {
          const angle = vector::angleBetween(trajectory);
          return [abs(angle), angle::sign()];
        });

        if (angle > maxHomingAngle)
          return 0.0;
        if (distance <= fullHomingRadius)
          return angleSign * min(angle, maxDriftAngle);
        // Falloff the homing strength based on distance.
        const nDist = distance - fullHomingRadius;
        const powerScalar = nDist::map(homingRange - fullHomingRadius, 0.0, 0.0, 1.0);
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
      node1Pos::add(trajectory::copy()::mul(bulletVel * delta));
      doChase(node1Pos, node2Pos, chaseDistNode2);
      doChase(node2Pos, node3Pos, chaseDistNode3);
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

export { directions, facings, aimings, jumps };
export { nateActionList, bulletActionList };