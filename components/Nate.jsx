import { dew, makeArray, forZipped, forOwnProps } from "/tools/common";
import maybe from "/tools/maybe";
import bulletActionList from "./nateLogic/bulletActionList";
import nateActionList from "./nateLogic/nateActionList";
import { behaviorModes, facings, aimings, movings, jumps } from "./nateLogic/core";

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
   * The div elements for the bullets, first by bullet, then by node.
   *
   * @type {HTMLDivElement[][]}
   * @memberof Nate
   */
  bulletNodes = maybe.nothing;

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
        // Current behavior mode.
        behavior: behaviorModes.aggressive,
        // Represent actions to be taken.
        moving: movings.no,
        lookingUp: false,
        jumping: jumps.none,
        shooting: aimings.none,
        // Represent conditions of actions.
        facing: facings.right,
        aiming: aimings.none,
        // Timers.
        retaliationTimer: 0.0,
        shootCoolDown: 0.0,
        shootHold: 0.0,
        pacificationTimer: 0.0
      },
      anim: {
        main: ["idle"],
        shoot: [],
        recoil: false,
        land: 0.0
      },
      sounds: {
        bark: React.createRef(),
        aroo: React.createRef(),
        jump: React.createRef(),
        land: React.createRef()
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
      initialized: false,
      timeout: 0.0,
      burst: 0.0,
      trajectory: { x: 0.0, y: 0.0 },
      driftRemaining: 0.0,
      nodePositions: [
        { x: 0.0, y: 0.0 },
        { x: 0.0, y: 0.0 },
        { x: 0.0, y: 0.0 },
      ],
      sounds: {
        spawned: React.createRef(),
        hit: React.createRef(),
        timedOut: React.createRef()
      }
    }))
  };

  constructor(props) {
    super(props);
    this.setState = ::this.setState;
    this.scrollHandler = ::this.scrollHandler;
    this.mouseMoveHandler = ::this.mouseMoveHandler;
    this.animationFrame = ::this.animationFrame;
  }

  componentDidMount() {
    this.timeLast = performance.now();
    this.nateDiv = maybe.one(document.createElement("div"));
    this.bulletNodes = maybe.some(...this.world.bullets.map(() => {
        return Object.freeze(makeArray(3, () => document.createElement("div")));
      })
    );

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

    // Attach the game elements.
    this.nateDiv.forEach(div => container.appendChild(div));
    this.bulletNodes.forEach(nodes => nodes.forEach(div => container.appendChild(div)));

    // Set sound volume.
    const soundSetter = (sound) => {
      if (sound.current == null) return;
      sound.current.volume = 0.33;
    }

    this.world.nate.sounds::forOwnProps(soundSetter);
    this.world.bullets.forEach(bullet => bullet.sounds::forOwnProps(soundSetter));
  }

  /**
   * @param {MouseEvent} e
   * @memberof Nate
   */
  mouseMoveHandler(e) {
    const cursor = this.world.cursor;
    cursor.absPos.x = e.clientX;
    cursor.absPos.y = e.clientY;
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
    const delta = Math.min(timeNow - this.timeLast, 50.0);
    //const delta = (1000 / 60) / 10;
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
    this.nateDiv.forEach(nateDiv => {
      const nate = this.world.nate;
      const listState = { delta, actions: nate.actions, lanes: new Set() };
      this.world.nate.actions = {};
      nateActionList.forEach(action => action(nate, this.world, listState));

      const { physics: { pos: { x, y } }, anim: { main, shoot } } = nate;
      nateDiv.className = ["nate-sprite", ...main, ...shoot].join(" ");
      nateDiv.setAttribute("style", `left: ${x | 0}px; bottom: ${y | 0}px`);
    });

    // Update bullets.
    forZipped(this.world.bullets, this.bulletNodes, (bullet, bulletNodeDivs) => {
      const listState = { delta, lanes: new Set() };
      bulletActionList.forEach(action => action(bullet, this.world, listState));

      if (!bullet.spawned) {
        bulletNodeDivs.forEach(div => div.className = "despawned");
        return;
      }
      const bursting = bullet.burst > 0.0;
      const baseClassName = bursting ? "bullet-burst-sprite" : "bullet-sprite";

      forZipped(bullet.nodePositions, bulletNodeDivs, ({x, y}, div, i) => {
        if (bursting && i > 0)
          div.className = "despawned";
        else {
          div.className = `${baseClassName} node-${i + 1}`;
          div.setAttribute("style", `left: ${x}px; bottom: ${y}px`);
        }
      });
    });
  }

  render() {
    return (
      <div className="nate-container" ref={this.containerRef}>
        <audio ref={this.world.nate.sounds.bark}>
          <source src="static/sounds/nate-game/bow-wow.ogg" type="audio/ogg; codecs=vorbis" />
          <source src="static/sounds/nate-game/bow-wow.mp3" type="audio/mpeg" />
        </audio>
        <audio ref={this.world.nate.sounds.aroo}>
          <source src="static/sounds/nate-game/aroo.ogg" type="audio/ogg; codecs=vorbis" />
          <source src="static/sounds/nate-game/aroo.mp3" type="audio/mpeg" />
        </audio>
        <audio ref={this.world.nate.sounds.land}>
          <source src="static/sounds/nate-game/land.ogg" type="audio/ogg; codecs=vorbis" />
          <source src="static/sounds/nate-game/land.mp3" type="audio/mpeg" />
        </audio>
        {this.world.bullets.map((bullet, i) => {
          return (
            <React.Fragment key={i}>
              <audio ref={bullet.sounds.spawned}>
                <source src="static/sounds/nate-game/pew.ogg" type="audio/ogg; codecs=vorbis" />
                <source src="static/sounds/nate-game/pew.mp3" type="audio/mpeg" />
              </audio>
              <audio ref={bullet.sounds.hit}>
                <source src="static/sounds/nate-game/pop1.ogg" type="audio/ogg; codecs=vorbis" />
                <source src="static/sounds/nate-game/pop1.mp3" type="audio/mpeg" />
              </audio>
              <audio ref={bullet.sounds.timedOut}>
                <source src="static/sounds/nate-game/pop2.ogg" type="audio/ogg; codecs=vorbis" />
                <source src="static/sounds/nate-game/pop2.mp3" type="audio/mpeg" />
              </audio>
            </React.Fragment>
          );
        })}
      </div>
    );
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
