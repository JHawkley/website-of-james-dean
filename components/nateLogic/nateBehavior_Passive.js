import { behaviorModes, subList } from "./core";
import * as actions from "./nateActions_Debug";

function qualificationFn(nate) {
  return nate.brain.behavior === behaviorModes.passive;
}

export default subList(qualificationFn, [
  actions.randomIdle,
  actions.paceBackAndForth,
  actions.randomJump,
  actions.randomShoot
]);