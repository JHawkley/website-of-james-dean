import { isNotEmpty } from "/tools/maybe";
import { clamp } from "/tools/numbers";
import { aimings, facings } from "./core";
import * as nc from "./nateConfig";

const { abs } = Math;
const { shootOffsets, ranges: { firingField } } = nc;

/**
 * Determines the best direction to aim to hit the `target`.
 *
 * @param {*} nate Nate's current state.
 * @param {{ x: number, y: number }} target The position of the target.
 * @returns {Symbol} An aiming; may be `none` if no aiming is suitable.
 */
export function bestAiming(nate, target) {
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
}