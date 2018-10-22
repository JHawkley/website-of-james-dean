import { subList } from "./core";
import * as actions from "./nateActions_Boredom";

export default subList(actions.qualificationFn, [
  actions.beFrustrated,
  actions.becomePassive,
  actions.decrementBoredomTimer
]);