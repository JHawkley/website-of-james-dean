import * as coreActions from "./nateActions_Core";
//import * as debugActions from "./nateActions_Debug";
import passiveBehavior from "./nateBehavior_Passive";
import aggressiveBehavior from "./nateBehavior_Aggressive";

export default Object.freeze([
  coreActions.doSpawn,
  coreActions.runTimers,
  passiveBehavior,
  aggressiveBehavior,
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