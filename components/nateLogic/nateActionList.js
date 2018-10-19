import * as coreActions from "./nateActions_Core";
import * as debugActions from "./nateActions_Debug";
import fleeBehavior from "./nateBehavior_Flee";
import chaseBehavior from "./nateBehavior_Chase";

export default Object.freeze([
  coreActions.doSpawn,
  coreActions.runTimers,
  fleeBehavior,
  chaseBehavior,
  //debugActions.randomIdle,
  //debugActions.paceBackAndForth,
  //debugActions.randomJump,
  //debugActions.randomShoot,
  //debugActions.logJumpHeights,
  coreActions.doMove,
  coreActions.doJump,
  coreActions.applyPhysics,
  coreActions.collideFloor,
  coreActions.doShoot,
  coreActions.applyMainAnim,
  coreActions.applyShootAnim,
  coreActions.doReset
]);