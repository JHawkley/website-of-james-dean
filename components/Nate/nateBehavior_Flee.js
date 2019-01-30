import { subList } from "./core";
import * as actions from "./nateActions_Flee";

export default subList(actions.qualificationFn, [
  actions.fleeFromEdge,
  actions.fleeFromCursor,
  actions.retaliateShootUp,
  actions.retaliateJumpOver,
  actions.retaliateBackFire
]);