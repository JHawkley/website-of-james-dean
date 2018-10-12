import maybe, { isNotEmpty } from "../tools/maybe";
import { dew, copyOwn, randomBetween } from "../tools/common";
import { toRadians, map, clamp, sign, inRange } from "../tools/numbers";
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

const movings = Object.freeze({
  no: Symbol("no"),
  drift: Symbol("drift"),
  yes: Symbol("yes")
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
  // Symbols identifying lanes in the action-list.
  const handledMovement = Symbol("handledMovement");
  const behaviorFinalized = Symbol("behaviorFinalized");
  const didFlee = Symbol("didFlee");
  const didRetaliate = Symbol("didRetaliate");

  // The distances that Nate will consider the cursor too close, based on direction.
  const fleeRanges = { side: 100, above: 100, below: 24 };
  // The percentage of the bounds that Nate will travel when being chased from an edge.
  const edgeFleeDistances = { min: 0.1, max: 0.2 };
  // The number of pixels above or below Nate's hand he will consider close-enough to fire.
  const firingField = 15;
  // The "comfortable" firing range for the cursor to be.
  const comfortableRange = { min: 150, max: 300 };
  // The maximum distance the cursor should be when intending to jump over it.
  const jumpOverDistance = 30;

  // The hitbox width and height.
  const hBoxHalfWidth = 7;
  const hBoxHeight = 42;
  // The physical parameters for Nate.
  const maxVel = 130 / 1000;
  const friction = stokesDrag.solveFriction(250);
  const runAccel = stokesDrag.solveAccel(friction, maxVel);
  // The velocity to set Nate's vertical momentum to when he jumps.
  const jumpVelFull = 375 / 1000;
  const jumpVelWeak = 275 / 1000;

  // The amount of time between shots.
  const shootCoolDownValue = 200;
  // The amount of time Nate will hold up his hand after a shot.
  const shootHoldValue = 500;
  // When `shootHold` is below this value, `recoil` will be cleared if it is `true`.
  const shootRecoilThreshold = 300;
  // The amount of additional time that should pass before attempting to retaliate against
  // the cursor again when fleeing.
  const retaliationWaitTime = 1000;

  // The offsets from Nate's position that bullets should shoot from.
  // This assumes a right facing, so negate the `x` component if the facing is left.
  const shootOffsets = dew(() => {
    const lock = (obj) => maybe.one(Object.freeze(obj));
    const offsets = Object.freeze([
      lock({ x: 18, y: 27 }), // ahead + in-air
      lock({ x: 20, y: 24 }), // ahead + running
      lock({ x: 18, y: 25 }), // ahead + idle
      lock({ x: 9, y: 45 }),  // up + in-air
      lock({ x: 11, y: 42 }), // up + running
      lock({ x: 8, y: 43 }),  // up + idle
      lock({ x: 10, y: 18 })  // down + in-air
    ]);

    return (aiming, nate) => {
      const { brain: { moving }, physics: { onGround } } = nate;
      if (aiming === aimings.ahead) {
        if (!onGround) return offsets[0];
        if (moving === movings.yes) return offsets[1];
        return offsets[2];
      }
      if (aiming === aimings.up) {
        if (!onGround) return offsets[3];
        if (moving === movings.yes) return offsets[4];
        return offsets[5];
      }
      if (aiming === aimings.down && !onGround)
        return offsets[6];
      return maybe.nothing;
    };
  });

  // Looking at the current state of Nate and the cursor, determines the best `aimings`
  // direction to fire a bullet.  Returns `aimings.none` if no direction is likely to hit.
  const bestAiming = (nate, target) => {
    const { physics: { pos: natePos }, brain: { facing, shootCoolDown } } = nate;

    if (shootCoolDown > 0.0) return aimings.none;

    const horizDiff = (target.x - natePos.x) * (facing === facings.left ? -1 : 1);
    const vertDiff = target.y - natePos.y;
    let shootOffset;

    shootOffset = shootOffsets(aimings.down, nate);
    if (shootOffset::isNotEmpty()) {
      const [{x: ox, y: oy}] = shootOffset;
      const xd = horizDiff - ox;
      const yd = vertDiff - oy;
      if (yd <= 0.0 && abs(xd) <= (-yd)::clamp(firingField))
        return aimings.down;
    }

    shootOffset = shootOffsets(aimings.up, nate);
    if (shootOffset::isNotEmpty()) {
      const [{x: ox, y: oy}] = shootOffset;
      const xd = horizDiff - ox;
      const yd = vertDiff - oy;
      if (yd >= 0.0 && abs(xd) <= yd::clamp(firingField))
        return aimings.up;
    }

    shootOffset = shootOffsets(aimings.ahead, nate);
    if (shootOffset::isNotEmpty()) {
      const [{x: ox, y: oy}] = shootOffset;
      const xd = horizDiff - ox;
      const yd = vertDiff - oy;
      if (xd >= 0.0 && abs(yd) <= xd::clamp(firingField))
        return aimings.ahead;
    }

    return aimings.none;
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
      brain.retaliationTimer = decrementTime(brain.retaliationTimer, delta);
      brain.shootCoolDown = decrementTime(brain.shootCoolDown, delta);
      brain.shootHold = decrementTime(brain.shootHold, delta);
    },

    fleeBehavior: dew(() => {

      const defaultState = Object.freeze({ until: 0.0, forced: false });

      const calcFleeDist = (bounds, {min: minDist, max: maxDist}) => {
        const width = bounds.right - bounds.left;
        return max(randomBetween(minDist * width, maxDist * width), fleeRanges.side);
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
          if (vertDiff >= 0 && vertDiff > fleeRanges.above) return false;
          if (vertDiff < 0 && -vertDiff > fleeRanges.below) return false;
          if (abs(horizDiff) > fleeRanges.side) return false;
        }

        const state = actions["fleeBehavior"] ?? dew(() => {
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
          if (abs(horizDiff) > hBoxHalfWidth * 2) return false;
          if (vertDiff <= hBoxHeight) return false;
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
          if (abs(horizDiff) > jumpOverDistance) return false;

          // ...or if the cursor is too high or too low.
          if (!vertDiff::inRange(-comfortableRange.max, hBoxHeight)) return false;

          // Retaliate if the cursor is touching his hitbox...
          if (abs(horizDiff) <= hBoxHalfWidth && horizDiff::inRange(0.0, hBoxHeight)) return true;

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
          if (abs(vel.x) < maxVel * 0.9) return false;

          // Don't retaliate if we have too few bullets to make it worth it.
          const unspawnedCount = bullets.reduce((c, bullet) => c + (!bullet.spawned ? 1 : 0), 0);
          if (unspawnedCount < 2) return false;

          // Don't retaliate if the cursor is too low.
          if (vertDiff < 15.0) return false;

          // Don't retaliate if the cursor is too close.
          if (abs(horizDiff) <= hBoxHalfWidth * 2) return false;

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
      if (pos.x - hBoxHalfWidth <= bounds.left) brain.facing = facings.right;
      if (pos.x + hBoxHalfWidth >= bounds.right) brain.facing = facings.left;
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
      accel.x = dir * runAccel;
    },

    doJump(nate) {
      const { brain, physics } = nate;
      if (brain.jumping === jumps.none) return;
      physics.vel.y += brain.jumping === jumps.full ? jumpVelFull : jumpVelWeak;
      physics.onGround = false;
    },

    applyPhysics(nate, {bounds}, {delta}) {
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
  // Symbols identifying lanes in the action-list.
  const handledLogic = Symbol("handledLogic");
  const didInitialize = Symbol("didInitialize");

  // The minimum range before the bullet can home on the cursor.
  const homingRange = 100.0;
  // The radius at which homing will be at full strength.
  const fullHomingRadius = homingRange * 0.25;
  // The field-of-view of the bullet; the cursor must be in view to home.
  const maxHomingAngle = 120.0::toRadians();
  // The maximum amount the bullet can turn, per millisecond.
  const maxDrift = 150.0::toRadians() / 1000;
  // The maximum amount a bullet can turn in its life-time.
  const driftRemainingValue = 60.0::toRadians();

  // The velocity of a bullet.
  const bulletVel = 450 / 1000;
  // The amount of time a bullet has before expiring.
  const timeoutValue = 1000;
  // The amount of time the burst will remain before the bullet despawns.
  const burstLifetime = 150;

  // The maximum distance that each node of the bullet allow from its leader.
  const chaseDistNode2 = 3;
  const chaseDistNode3 = 3;

  const doChase = (leader, chaser, followDistance) => {
    const direction = chaser::copyOwn()::sub(leader);
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
      const distance = cursor.relPos::copyOwn()::sub(bulletPos)::vLength();

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
      const vector = cursorPos::copyOwn()::sub(bulletPos);
      const distance = vector::vLength();
      
      if (distance > homingRange) return;

      const driftAngle = dew(() => {
        const maxDriftAngle = min(maxDrift * delta, bullet.driftRemaining);
        const [angle, angleSign] = dew(() => {
          const angle = vector::angleBetween(trajectory);
          return [abs(angle), angle::sign()];
        });

        if (angle > maxHomingAngle * 0.5)
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
      node1Pos::add(trajectory::copyOwn()::mul(bulletVel * delta));
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

export { directions, facings, aimings, movings, jumps };
export { nateActionList, bulletActionList };