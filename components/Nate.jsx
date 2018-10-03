import { dew, makeArray, marry, maybe } from "./_tools";
import { nateActionList, bulletActionList } from "./_nateLogic";
import { bulletPosition } from "./_nateLogic";
import { directions, facings, aimings, jumps } from "./_nateLogic";

class Nate extends React.Component {

  /**
   * Reference for the React element that will contain our game's elements.
   *
   * @memberof Nate
   */
  containerRef = React.createRef();

  /**
   * The div element for the Nate sprite; an array of zero or one elements.
   * 
   * @type {HTMLDivElement[]}
   * @memberof Nate
   */
  nateDiv = maybe.nothing;

  /**
   * The div elements for the bullets.
   *
   * @type {HTMLDivElement[]}
   * @memberof Nate
   */
  bulletDivs = maybe.nothing;

  /**
   * The current handle for the queued animation frame; an array of zero or one elements.
   *
   * @type {number[]}
   * @memberof Nate
   */
  rafHandle = maybe.nothing;

  /**
   * The game's world-state.
   *
   * @memberof Nate
   */
  world = {
    nate: {
      physics: {
        vel: { x: 0.0, y: 0.0 },
        accel: { x: 0.0, y: 0.0 },
        pos: { x: 0.0, y: 0.0 },
        onGround: false
      },
      brain: {
        // Represent actions to be taken.
        moving: false,
        lookingUp: false,
        jumping: jumps.none,
        shooting: aimings.none,
        // Represent conditions of actions.
        facing: facings.right,
        aiming: aimings.none,
        // Timers.
        shootCoolDown: 0.0,
        shootHold: 0.0,
        boredTimer: 0.0
      },
      anim: {
        main: ["idle"],
        shoot: [],
        recoil: false,
        land: 0.0
      },
      spawned: false,
      actions: {}
    },
    bounds: { left: 0.0, right: 0.0, ground: 0.0 },
    cursor: {
      absPos: { x: 0, y: 0 },
      relPos: { x: 0, y: 0 },
      msSinceUpdate: 0.0
    },
    bullets: makeArray(3, () => ({
      spawned: false,
      justSpawned: false,
      origin: { x: 0.0, y: 0.0 },
      dir: directions.right,
      distance: 0.0,
      burst: 0.0
    }))
  };

  constructor(props) {
    super(props);
    this.setState = this.setState.bind(this);
    this.scrollHandler = this.scrollHandler.bind(this);
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
    this.animationFrame = this.animationFrame.bind(this);
  }

  componentDidMount() {
    this.timeLast = performance.now();
    this.nateDiv = maybe.one(document.createElement("div"));
    this.bulletDivs = maybe.some(...this.world.bullets.map(() => document.createElement("div")));

    this.rafHandle = maybe.one(requestAnimationFrame(this.animationFrame));
    document.addEventListener("mousemove", this.mouseMoveHandler);
    document.addEventListener("scroll", this.scrollHandler);

    this.attachGameElements();
  }

  componentDidUpdate() {
    this.attachGameElements();
  }

  componentWillUnmount() {
    this.rafHandle.forEach(cancelAnimationFrame);
    document.removeEventListener("mousemove", this.mouseMoveHandler);
    document.removeEventListener("scroll", this.scrollHandler);
  }

  attachGameElements() {
    const container = this.containerRef.current;
    if (container == null) return;

    this.nateDiv.forEach(div => container.appendChild(div));
    this.bulletDivs.forEach(div => container.appendChild(div));
  }

  /**
   * @param {MouseEvent} e
   * @memberof Nate
   */
  mouseMoveHandler(e) {
    const cursor = this.world.cursor;
    cursor.absPos.x = e.clientX;
    cursor.absPos.y = e.clientY;
    cursor.scroll = maybe.nothing;
    cursor.msSinceUpdate = 0;
  }

  scrollHandler() {
    // If the screen scrolls but the mouse doesn't move, then the absolute
    // client position hasn't changed.  In this case, we only need to update
    // the position relative to the container.
    //
    // Resetting the `msSinceUpdate` to zero will force this recalculation.
    this.world.cursor.msSinceUpdate = 0;
  }

  /**
   * @param {Number} timeNow
   * @memberof Nate
   */
  animationFrame(timeNow) {
    this.doGameUpdate(timeNow);
    this.timeLast = timeNow;
    this.rafHandle = maybe.one(requestAnimationFrame(this.animationFrame));
  }

  /**
   * @param {Double} timeNow
   * @memberof Nate
   */
  doGameUpdate(timeNow) {
    const delta = Math.min(timeNow - this.timeLast, 100.0);
    const container = this.containerRef.current;
    if (delta <= 0.0) return;
    if (container == null) return;

    // Update bounds.
    {
      const bounds = this.world.bounds;
      const rect = container.getBoundingClientRect();
      bounds.right = rect.width;
      bounds.ground = rect.height;
    }

    // Update cursor.
    {
      const cursor = this.world.cursor;
      if (cursor.msSinceUpdate <= 0) {
        const { x: cx, y: cy } = cursor.absPos;
        const { left: bx, bottom: by } = container.getBoundingClientRect();
        cursor.relPos.x = cx - bx;
        cursor.relPos.y = -(cy - by);
      }
      cursor.msSinceUpdate += delta;
    }
    
    // Update Nate.
    this.nateDiv.forEach((nateDiv) => {
      const nate = this.world.nate;
      const listState = { delta, actions: nate.actions, lanes: new Set() };
      this.world.nate.actions = {};
      nateActionList.forEach((action) => action(nate, this.world, listState));

      const { physics: { pos: { x, y } }, anim: { main, shoot } } = nate;
      nateDiv.className = ["nate-sprite", ...main, ...shoot].join(" ");
      nateDiv.setAttribute("style", `left: ${x | 0}px; bottom: ${y | 0}px`);
    });

    // Update bullets.
    marry(this.world.bullets, this.bulletDivs, (bullet, bulletDiv) => {
      const listState = { delta, lanes: new Set() };
      bulletActionList.forEach((action) => action(bullet, this.world, listState));

      const { dir, distance, burst } = bullet;
      const tags = [];

      if (!bullet.spawned) {
        bulletDiv.className = "despawned";
        return;
      }

      const [x, y] = bulletPosition(bullet);

      if (burst <= 0) {
        tags.push("bullet-sprite");
        if (dir === directions.up) tags.push("shot-up");
        else if (dir === directions.down) tags.push("shot-down");
        else if (dir === directions.left) tags.push("mirror");

        if (distance < 22.0) tags.push("forming");
      }
      else tags.push("bullet-burst-sprite");

      bulletDiv.className = tags.join(" ");
      bulletDiv.setAttribute("style", `left: ${x | 0}px; bottom: ${y | 0}px`);
    });
  }

  render() {
    return <div className="nate-container" ref={this.containerRef} />;
  }

}

Nate.supported = dew(() => {
  const g = this;
  let supported = undefined;

  const detectAnimation = () => {
    const elem = g.document.createElement('div');
    const prefixes = "animationName WebkitAnimationName MozAnimationName OAnimationName msAnimationName KhtmlAnimationName".split(" ");
    
    for(let i = 0; i < prefixes.length; i++)
      if(typeof elem.style[prefixes[i]] !== "undefined")
        return true;
    
    return false;
  }

  const detectTransform = () => {
    const elem = g.document.createElement('div');
    const prefixes = "transform WebkitTransform MozTransform OTransform msTransform".split(" ");

    for(let i = 0; i < prefixes.length; i++)
      if(typeof elem.style[prefixes[i]] !== "undefined")
        return true;

    return false;
  }

  const detectRequestAnimationFrame = () => {
    if (typeof g["requestAnimationFrame"] !== "function") return false;
    if (typeof g["cancelAnimationFrame"] !== "function") return false;
    return true;
  }

  const detectSet = () => typeof g["Set"] === "function";

  return () => {
    if (typeof supported !== "undefined") return supported;
    supported = detectRequestAnimationFrame() && detectAnimation() && detectTransform() && detectSet();
    return supported;
  };
});

export default Nate;
