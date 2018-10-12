import * as coreActions from "./nateActions_Core";
import * as debugActions from "./nateActions_Debug";
import fleeBehavior from "./nateBehavior_Flee";

export default Object.freeze([
  coreActions.doSpawn,
  coreActions.runTimers,
  fleeBehavior,
  // Chase Behavior
  //debugActions.randomIdle,
  //debugActions.paceBackAndForth,
  //debugActions.randomJump,
  //debugActions.randomShoot,
  coreActions.doMove,
  coreActions.doJump,
  coreActions.applyPhysics,
  coreActions.collideFloor,
  coreActions.doShoot,
  coreActions.applyMainAnim,
  coreActions.applyShootAnim,
  coreActions.doReset
]);