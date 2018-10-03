import { dew, maybe } from "./_tools";

const randomTime = (start, added) => start + (Math.random() * added);
const decrementTime = (time, delta) => Math.max(0.0, time - delta);

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

const bulletPosition = (bullet) => {
  const { dir, distance } = bullet;
  let { origin: { x, y } } = bullet;
  if (dir === directions.up) y += distance;
  else if (dir === directions.right) x += distance;
  else if (dir === directions.down) y -= distance;
  else if (dir === directions.left) x -= distance;
  return [x, y];
};

const nateActionList = dew(() => {
  const handledMovement = Symbol("handledMovement");

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

    debug_randomIdle(nate, _, {delta, actions, lanes}) {
      const state = actions["debug_randomIdle"] ?? dew(() => {
        const [waitingTime, doElseTime] = dew(() => {
          const time = randomTime(1000.0, 2000.0);
          return Math.random() > 0.5 ? [time, 0.0] : [0.0, time];
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
          state.lookUp = Math.random() > 0.75;
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
        brain.jumping = Math.random() > 0.5 ? jumps.full : jumps.weak;
    },

    debug_randomShoot(nate, _, {delta, actions}) {
      const { brain } = nate;
      if (brain.shootCoolDown > 0) return;

      const state = actions["debug_randomShoot"] ?? {
        nextShoot: Math.random() > 0.5 ? 0.0 : Math.random() * 3000.0
      };

      state.nextShoot = decrementTime(state.nextShoot, delta);
      if (state.nextShoot <= 0.0) {
        brain.shooting = dew(() => {
          const val = Math.random();
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
          bullet.justSpawned = true;
          bullet.origin.x = px + ox;
          bullet.origin.y = py + oy;
          bullet.distance = 0.0;
          bullet.burst = 0.0;
          bullet.dir = dir;
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
    actions.debug_randomIdle,
    //actions.debug_paceBackAndForth,
    //actions.debug_randomJump,
    actions.debug_randomShoot,
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

  const bulletVel = 450 / 1000;
  const maxDistance = 500;
  const burstLifetime = 150;

  const actions = {

    collideWithCursor(bullet, {cursor}) {
      if (!bullet.spawned) return;
      if (bullet.burst > 0.0) return;

      const {x: cx, y: cy } = cursor.relPos;
      const [bx, by] = bulletPosition(bullet);
      const dx = Math.abs(cx - bx);
      const dy = Math.abs(cy - by);

      if (dx <= 4 && dy <= 4) {
        bullet.justSpawned = false;
        bullet.burst = burstLifetime;
      }
    },

    expire(bullet) {
      if (!bullet.spawned) return;
      if (bullet.distance >= maxDistance && bullet.burst <= 0.0)
        bullet.burst = burstLifetime;
    },

    handleJustSpawned(bullet, _, {lanes}) {
      if (!bullet.spawned) return;
      if (!bullet.justSpawned) return;
      bullet.justSpawned = false;
      lanes.add(handledLogic);
    },

    handleBurst(bullet, _, {delta, lanes}) {
      if (!bullet.spawned) return;
      if (lanes.has(handledLogic)) return;
      if (bullet.burst <= 0.0) return;

      bullet.burst = decrementTime(bullet.burst, delta);
      if (bullet.burst <= 0.0)
        bullet.spawned = false;
      lanes.add(handledLogic);
    },

    handleFlight(bullet, _, {delta, lanes}) {
      if (!bullet.spawned) return;
      if (lanes.has(handledLogic)) return;
      bullet.distance += bulletVel * delta;
      lanes.add(handledLogic);
    }

  };

  return Object.freeze([
    actions.collideWithCursor,
    actions.expire,
    actions.handleJustSpawned,
    actions.handleBurst,
    actions.handleFlight
  ]);
});

export { directions, facings, aimings, jumps };
export { bulletPosition };
export { nateActionList, bulletActionList };