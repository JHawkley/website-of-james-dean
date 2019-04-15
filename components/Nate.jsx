import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { dew, is, global } from "tools/common";
import { extensions as asyncEx, Task, eachFrame } from "tools/async";
import { makeArray } from "tools/array";
import { flatMap } from "tools/extensions/array";
import bulletActionList from "./Nate/bulletActionList";
import nateActionList from "./Nate/nateActionList";
import { behaviorModes, facings, aimings, movings, jumps, tracks } from "./Nate/core";
import Preloadable from "components/Preloadable";
import Preloader from "components/Preloader";
import Audio from "components/Audio";
import LoadingSpinner from "components/LoadingSpinner";
import NotSupportedError from "components/Nate/BrowserUnsupportedError";
import GameUpdateError from "components/Nate/GameUpdateError";

import { fadeTime, componentCss, containerCss, nateSpriteCss, bulletSpriteCss } from "styles/jsx/components/Nate";
import { ImgNate, ImgBullet, ImgBulletBurst } from "styles/jsx/components/Nate";

import OggBowWow from "static/sounds/nate-game/bow-wow.ogg?codec=vorbis";
import Mp3BowWow from "static/sounds/nate-game/bow-wow.mp3";
import OggAroo from "static/sounds/nate-game/aroo.ogg?codec=vorbis";
import Mp3Aroo from "static/sounds/nate-game/aroo.mp3";
import OggLand from "static/sounds/nate-game/land.ogg?codec=vorbis";
import Mp3Land from "static/sounds/nate-game/land.mp3";
import OggPew from "static/sounds/nate-game/pew.ogg?codec=vorbis";
import Mp3Pew from "static/sounds/nate-game/pew.mp3";
import OggPop1 from "static/sounds/nate-game/pop1.ogg?codec=vorbis";
import Mp3Pop1 from "static/sounds/nate-game/pop1.mp3";
import OggPop2 from "static/sounds/nate-game/pop2.ogg?codec=vorbis";
import Mp3Pop2 from "static/sounds/nate-game/pop2.mp3";

const $notSupported = "the `Nate` component is not supported by the current browser";
const $gameDetached = "game detached from the container";
const $preloadingFailed = "preloading failed with an error";
const $gameFailed = "game failed with an error";

class Nate extends React.PureComponent {

  static propTypes = {
    onGameError: PropTypes.func
  };

  state = {
    imagesReady: false,
    soundsReady: false,
    preloadError: null,
    gameError: !supported() ? new NotSupportedError($notSupported) : null
  };

  soundsEnabled = false;

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
        behavior: behaviorModes.passive,
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
        [tracks.bark]: this.soundPlayer(),
        [tracks.aroo]: this.soundPlayer(),
        [tracks.land]: this.soundPlayer()
      },
      spawned: false,
      actions: {},
      ref: React.createRef()
    },
    bounds: {
      left: 0.0,
      right: 0.0,
      ground: 0.0,
      ref: React.createRef()
    },
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
      nodes: [
        { pos: { x: 0.0, y: 0.0 }, ref: React.createRef() },
        { pos: { x: 0.0, y: 0.0 }, ref: React.createRef() },
        { pos: { x: 0.0, y: 0.0 }, ref: React.createRef() },
      ],
      sounds: {
        [tracks.spawned]: this.soundPlayer(),
        [tracks.hit]: this.soundPlayer(),
        [tracks.timedOut]: this.soundPlayer()
      }
    }))
  };

  runGameLoopTask = dew(() => {
    const runGameLoop = async (stopSignal, container) => {
      try {
        document.addEventListener("mousemove", this.mouseMoveHandler);
        document.addEventListener("scroll", this.scrollHandler);

        let timeLast = performance.now();
        await eachFrame(stopSignal, (timeNow) => {
          try {
            const delta = Math.min(timeNow - timeLast, 50.0);
            //const delta = (1000 / 60) / 10;
            timeLast = timeNow;
            this.doGameUpdate(delta, container);
            return true;
          }
          catch (capturedError) {
            throw new GameUpdateError("an error occurred while updating the game state", capturedError);
          }
        });
      }
      catch (gameError) {
        if (this.didUnmount) return;
        if (gameError::asyncEx.isAborted()) return;
        this.setState({ gameError });
      }
      finally {
        document.removeEventListener("mousemove", this.mouseMoveHandler);
        document.removeEventListener("scroll", this.scrollHandler);
      }
    };

    return new Task(runGameLoop);
  });

  onImagesReady = () => {
    if (this.didUnmount) return;
    this.setState({ imagesReady: true });
  }

  onImagesFailed = (preloadError) => {
    if (this.didUnmount) return;
    this.setState({ imagesReady: false, preloadError });
    return false;
  }

  onSoundsReady = () => {
    if (this.didUnmount) return;
    this.soundsEnabled = true;
    this.setState({ soundsReady: true });
  }

  onSoundsFailed = () => {
    if (this.didUnmount) return;
    // We can run fine without sounds; just disable them and continue.
    this.soundsEnabled = false;
    this.setState({ soundsReady: true });
    return false;
  }

  attachGame = (container) => {
    const { preloadError, gameError } = this.state;
    if (preloadError) this.runGameLoopTask.stop($preloadingFailed);
    else if (gameError) this.runGameLoopTask.stop($gameFailed);
    else if (!container) this.runGameLoopTask.stop($gameDetached);
    else this.runGameLoopTask.start(container);
  }

  mouseMoveHandler = (e) => {
    const cursor = this.world.cursor;
    cursor.absPos.x = e.clientX;
    cursor.absPos.y = e.clientY;
    cursor.msSinceUpdate = 0;
  }

  scrollHandler = () => {
    // If the screen scrolls but the mouse doesn't move, then the absolute
    // client position hasn't changed.  In this case, we only need to update
    // the position relative to the container.
    //
    // Resetting the `msSinceUpdate` to zero will force this recalculation.
    this.world.cursor.msSinceUpdate = 0;
  }

  doGameUpdate(delta, container) {
    if (delta <= 0.0) return;

    // Update bounds.
    {
      const bounds = this.world.bounds;
      const el = bounds.ref.current;
      if (el) {
        const elTop = el.offsetTop;
        const containerHeight = container.offsetHeight;
        bounds.right = el.offsetWidth;
        bounds.ground = containerHeight - elTop;
      }
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
    {
      const nate = this.world.nate;
      const listState = { delta, actions: nate.actions, lanes: new Set() };
      this.world.nate.actions = {};
      nateActionList.forEach(action => action(nate, this.world, listState));

      const {
        physics: { pos: { x, y } },
        anim: { main, shoot },
        ref: { current: el }
      } = nate;

      if (el) {
        el.className = [nateSpriteCss.className, main, shoot].flat().join(" ");
        el.style.left = (x | 0) + "px";
        el.style.bottom = (y | 0) + "px";
      }
    }

    // Update bullets.
    this.world.bullets.forEach((bullet) => {
      const listState = { delta, lanes: new Set() };
      bulletActionList.forEach(action => action(bullet, this.world, listState));

      const isBursting = bullet.burst > 0.0;

      bullet.nodes.forEach((node, i) => {
        const { ref: { current: el }, pos: { x, y } } = node;
        if (!el) return;

        const isDespawned = !bullet.spawned || (isBursting && i > 0);
        el::toggleClass("despawned", isDespawned);
        if (isDespawned) return;

        el::toggleClass("bullet", !isBursting);
        el::toggleClass("bullet-burst", isBursting);
        el.style.left = (x | 0) + "px";
        el.style.bottom = (y | 0) + "px";
      });
    });
  }

  soundPlayer() {
    let sound = null;

    const play = async () => {
      if (!sound) return;
      if (!this.soundsEnabled) return;
      // Only play sounds when Nate is in his aggressive behavior.
      // This is just to make the page less annoying; it only starts making sounds when
      // the user is supposedly interacting with Nate.
      if (this.world.nate.brain.behavior !== behaviorModes.aggressive) return;

      try {
        sound.pause();
        sound.currentTime = 0;
        await sound.play();
      }
      // Will throw if the user has not clicked on the browser.  Just black-hole it.
      catch { void 0; }
    };

    const ref = (audioElement) => {
      if (audioElement) audioElement.volume = 0.33;
      sound = audioElement;
    };

    return { play, ref };
  }

  raiseGameError(onGameError, gameError, throwIfNoHandler) {
    if (onGameError::is.func()) return onGameError(gameError);
    if (throwIfNoHandler) throw gameError;
  }

  componentDidMount() {
    const { props: { onGameError }, state: { gameError } } = this;
    if (gameError) this.raiseGameError(onGameError, gameError, true);
  }

  componentDidUpdate(prevProps, prevState) {
    const { props: { onGameError }, state: { gameError } } = this;

    if (gameError) {
      if (gameError !== prevState.gameError)
        this.raiseGameError(onGameError, gameError, true);
      else if (onGameError !== prevProps.onGameError)
        this.raiseGameError(onGameError, gameError, false);
    }
  }

  renderContainer(preloaded) {
    const { nate: { ref: nateRef }, bounds: { ref: groundRef } } = this.world;
    const { className: containerClass } = containerCss;
    const { className: nateClass } = nateSpriteCss;

    const attachGame = preloaded ? this.attachGame : null;
    const className = [containerClass, !preloaded && "loading"].filter(Boolean).join(" ");
    
    return (
      <div ref={attachGame} className={className}>
        <div className="buffer top" />
        <div ref={groundRef} className="ground-plane" />
        <div className="buffer bottom" />
        <div ref={nateRef} className={`${nateClass} despawned`} />
        {this.renderBullets()}
      </div>
    );
  }

  renderBullets() {
    const { className } = bulletSpriteCss;
    return this.world.bullets::flatMap((bullet, x) => bullet.nodes.map((node, y) => {
      return <div key={`${x}.${y}`} ref={node.ref} className={`${className} node-${y + 1} despawned`} />;
    }));
  }

  renderImages() {
    return (
      <Preloader onLoad={this.onImagesReady} onError={this.onImagesFailed} display="never" once>
        <ImgNate /><ImgBullet /><ImgBulletBurst />
      </Preloader>
    );
  }

  renderSounds() {
    const { nate: { sounds: nSounds }, bullets } = this.world;
    const { bark, aroo, land, spawned, hit, timedOut } = tracks;

    return (
      <Preloader onLoad={this.onSoundsReady} onError={this.onSoundsFailed} display="never" once>
        <Audio audioRef={nSounds[bark].ref}><OggBowWow asSource /><Mp3BowWow asSource /></Audio>
        <Audio audioRef={nSounds[aroo].ref}><OggAroo asSource /><Mp3Aroo asSource /></Audio>
        <Audio audioRef={nSounds[land].ref}><OggLand asSource /><Mp3Land asSource /></Audio>
        {bullets.map(({sounds: bSounds}, i) => (
          <Fragment key={i}>
            <Audio audioRef={bSounds[spawned].ref}><OggPew asSource /><Mp3Pew asSource /></Audio>
            <Audio audioRef={bSounds[hit].ref}><OggPop1 asSource /><Mp3Pop1 asSource /></Audio>
            <Audio audioRef={bSounds[timedOut].ref}><OggPop2 asSource /><Mp3Pop2 asSource /></Audio>
          </Fragment>
        ))}
      </Preloader>
    );
  }

  renderGame(preloaded) {
    return (
      <div className={componentCss.className}>
        <LoadingSpinner size="2x" fadeTime={fadeTime} show={!preloaded} background />
        {this.renderContainer(preloaded)}
        {this.renderImages()}
        {this.renderSounds()}
        {componentCss.styles}
        {nateSpriteCss.styles}
        {bulletSpriteCss.styles}
        {containerCss.styles}
      </div>
    );
  }

  render() {
    const { imagesReady, soundsReady, preloadError, gameError } = this.state;
    const preloaded = Boolean(preloadError) || (imagesReady && soundsReady);

    return (
      <Preloadable preloaded={preloaded} error={preloadError}>
        {!preloadError && !gameError && this.renderGame(preloaded)}
      </Preloadable>
    );
  }

}

const supported = dew(() => {
  let supported = undefined;

  const detectAnimation = () => {
    const elem = global.document.createElement('div');
    const prefixes = "animationName WebkitAnimationName MozAnimationName OAnimationName msAnimationName KhtmlAnimationName".split(" ");
    
    for(let i = 0; i < prefixes.length; i++)
      if(elem.style[prefixes[i]] != null)
        return true;
    
    return false;
  }

  const detectTransform = () => {
    const elem = global.document.createElement('div');
    const prefixes = "transform WebkitTransform MozTransform OTransform msTransform".split(" ");

    for(let i = 0; i < prefixes.length; i++)
      if(elem.style[prefixes[i]] != null)
        return true;

    return false;
  }

  const detectRequestAnimationFrame = () => {
    if (!global["requestAnimationFrame"]::is.func()) return false;
    if (!global["cancelAnimationFrame"]::is.func()) return false;
    return true;
  }

  const detectSet = () => global["Set"]::is.func();

  return () => {
    if (!process.browser) return true;
    if (supported == null)
      supported = detectRequestAnimationFrame() && detectAnimation() && detectTransform() && detectSet();
    return supported;
  };
});

// Helper function for IE11, which lacks support for the second argument
// to `Element.classList.toggle`.
function toggleClass(className, needs) {
  const has = this.classList.contains(className);
  if (needs && !has)
    this.classList.add(className);
  else if (!needs && has)
    this.classList.remove(className);
}

export default Nate;
