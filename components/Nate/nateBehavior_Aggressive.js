import { behaviorModes, subList } from "./core";
import fleeBehavior from "./nateBehavior_Flee";
import boredomBehavior from "./nateBehavior_Boredom";
import chaseBehavior from "./nateBehavior_Chase";

function qualificationFn(nate) {
  return nate.brain.behavior === behaviorModes.aggressive;
}

export default subList(qualificationFn, [
  boredomBehavior,
  fleeBehavior,
  chaseBehavior
]);