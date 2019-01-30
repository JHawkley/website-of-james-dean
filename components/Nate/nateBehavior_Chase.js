import { subList } from "./core";
import * as actions from "./nateActions_Chase";

export default subList(actions.qualificationFn, [
  actions.shootFromBelow,
  actions.shootFromAbove,
  actions.comfortableShooting
]);