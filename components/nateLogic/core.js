const { max, random: randomNum } = Math;

export const randomTime = (start, added) => start + (randomNum() * added);
export const decrementTime = (time, delta) => max(0.0, time - delta);

export const stokesDrag = {
  solveFriction: (tMax) => 5 / tMax,
  solveAccel: (f, vMax) => f * vMax,
  newVelocity: (a, f, v) => v + (a - f * v)
};

export const directions = Object.freeze({
  up: Symbol("up"),
  right: Symbol("right"),
  down: Symbol("down"),
  left: Symbol("left")
});

export const facings = Object.freeze({
  right: directions.right,
  left: directions.left
});

export const aimings = Object.freeze({
  ahead: Symbol("ahead"),
  up: directions.up,
  down: directions.down,
  none: Symbol("none")
});

export const movings = Object.freeze({
  no: Symbol("no"),
  drift: Symbol("drift"),
  yes: Symbol("yes")
});

export const jumps = Object.freeze({
  full: Symbol("full"),
  weak: Symbol("weak"),
  none: Symbol("none")
});

export const trajectories = Object.freeze({
  [directions.up]: Object.freeze({ x: 0.0, y: 1.0 }),
  [directions.right]: Object.freeze({ x: 1.0, y: 0.0 }),
  [directions.down]: Object.freeze({ x: 0.0, y: -1.0 }),
  [directions.left]: Object.freeze({ x: -1.0, y: 0.0 }),
});

export const subList = (qualificationFn, actionList) => {
  return (object, world, listState) => {
    if (qualificationFn(object, world, listState))
      actionList.forEach(action => action(object, world, listState));
  };
};