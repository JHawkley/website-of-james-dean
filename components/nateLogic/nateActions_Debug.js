import { dew } from "/tools/common";
import { decrementTime, randomTime } from "./core";
import { facings, aimings, movings, jumps } from "./core";
import * as nc from "./nateConfig";

const { random: randomNum } = Math;

const { lanes: { handledMovement }, hitbox: { halfWidth: hitboxHalfWidth } } = nc;

const $$randomIdle = Symbol("nateActions_Debug/randomIdle");
const $$randomJump = Symbol("nateActions_Debug/randomJump");
const $$randomShoot = Symbol("nateActions_Debug/randomShoot");

export function randomIdle(nate, _, {delta, actions, lanes}) {
  const state = actions[$$randomIdle] ?? dew(() => {
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

  nate.actions[$$randomIdle] = state;
}

export function paceBackAndForth(nate, {bounds}, {lanes}) {
  if (lanes.has(handledMovement)) return;
  lanes.add(handledMovement);
  const { brain, physics: { pos } } = nate;
  if (pos.x - hitboxHalfWidth <= bounds.left) brain.facing = facings.right;
  if (pos.x + hitboxHalfWidth >= bounds.right) brain.facing = facings.left;
  brain.moving = movings.yes;
}

export function randomJump(nate, _, {delta, actions}) {
  const { brain, physics } = nate;
  if (!physics.onGround) return;

  const state = actions[$$randomJump] ?? {
    nextJump: randomTime(500.0, 1500.0)
  };

  state.nextJump = decrementTime(state.nextJump, delta);
  if (state.nextJump > 0.0)
    nate.actions[$$randomJump] = state;
  else
    brain.jumping = randomNum() > 0.5 ? jumps.full : jumps.weak;
}

export function randomShoot(nate, _, {delta, actions}) {
  const { brain } = nate;
  if (brain.shootCoolDown > 0) return;

  const state = actions[$$randomShoot] ?? {
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

  nate.actions[$$randomShoot] = state;
}