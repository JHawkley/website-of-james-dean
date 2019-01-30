import { dew } from "tools/common";
import { decrementTime, randomTime } from "./core";
import { facings, aimings, movings, jumps } from "./core";
import { makeRandomJump } from "./nateCommon";
import * as nc from "./nateConfig";

const { random: randomNum } = Math;

const { lanes: { handledMovement }, hitbox: { halfWidth: hitboxHalfWidth } } = nc;

const $$randomIdle = Symbol("nateActions_Debug/randomIdle");
const $$randomShoot = Symbol("nateActions_Debug/randomShoot");
const $$logJumpHeights = Symbol("nateActions_Debug/logJumpHeights");

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

export const randomJump = makeRandomJump(500.0, 1500.0, "nateActions_Debug/randomJump");

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

export function logJumpHeights(nate, {bounds}, {actions}) {
  const { brain, physics } = nate;

  if (typeof actions[$$logJumpHeights] === "undefined")
    if (brain.jumping === jumps.none)
      return;

  const state = actions[$$logJumpHeights] ?? { jump: brain.jumping, height: 0.0, starting: true };

  if (physics.onGround && !state.starting) {
    const finalHeight = (state.height - bounds.ground) | 0;
    console.log(`jump height of ${state.jump.toString()}: ${finalHeight}`);
    return;
  }

  state.height = Math.max(state.height, physics.pos.y);
  state.starting = false;
  nate.actions[$$logJumpHeights] = state;
}