import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { css } from "styled-jsx/css";
import { dew, is, global } from "tools/common";
import { CallSync, eachFrame } from "tools/async";
import { abortionReason } from "tools/extensions/async";
import { makeArray } from "tools/array";
import { numeric } from "tools/css";
import bulletActionList from "./Nate/bulletActionList";
import nateActionList from "./Nate/nateActionList";
import { behaviorModes, facings, aimings, movings, jumps, tracks } from "./Nate/core";
import Preloadable from "components/Preloadable";
import Preloader from "components/Preloader";
import Audio from "components/Audio";
import LoadingSpinner from "components/LoadingSpinner";
import NotSupportedError from "components/Nate/NotSupportedError";
import GameUpdateError from "components/Nate/GameUpdateError";

import styleVars from "styles/vars.json";

import SpriteNate from "static/images/nate-game/nate_sprite.png";
import SpriteBullet from "static/images/nate-game/bullet_sprite.png";
import SpriteBulletBurst from "static/images/nate-game/bullet_burst_sprite.png";

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

// The amount of time in milliseconds to fade in/out when transitioning to/from loaded states.
const fadeTime = 300;

const $componentUnmounted = "component unmounted";
const $gameDetached = "detaching game from a container";
const $mountedWithError = "mounted with an error";
const $updatedWithError = "updated with an error";

class Nate extends Preloadable {

  static propTypes = {
    ...Preloadable.propTypes,
    onLoad: PropTypes.func,
    onError: PropTypes.func
  };

  static getDerivedStateFromProps(props, state) {
    if (state.error) return null;
    return { preloaded: state.imagesReady && state.soundsReady };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  cancelAsync = new CallSync(p => p::abortionReason());

  soundsEnabled = false;

  state = {
    ...this.state,
    imagesReady: false,
    soundsReady: false,
    error: dew(() => {
      if (supported()) return null;
      return new NotSupportedError("the `Nate` component is not supported by the current browser");
    })
  };

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

  onImagesReady = () => {
    if (this.didUnmount) return;
    this.setState({ imagesReady: true });
  }

  onImagesFailed = (error) => {
    if (this.didUnmount) return;
    this.setState({ imagesReady: false, error });
  }

  onSoundsReady = () => {
    if (this.didUnmount) return;
    this.soundsEnabled = true;
    this.setState({ soundsReady: true });
  }

  onSoundsFailed = () => {
    if (this.didUnmount) return;
    this.soundsEnabled = false;
    this.setState({ soundsReady: true });
  }

  attachGame = (container) => {
    if (!container) {
      this.cancelAsync.resolve($gameDetached);
      return;
    }

    document.addEventListener("mousemove", this.mouseMoveHandler);
    document.addEventListener("scroll", this.scrollHandler);

    let timeLast = performance.now();
    const stoppedPromise = eachFrame(this.cancelAsync.sync, (timeNow) => {
      try {
        const delta = Math.min(timeNow - timeLast, 50.0);
        //const delta = (1000 / 60) / 10;
        timeLast = timeNow;
        this.doGameUpdate(delta, container);
        return true;
      }
      catch (capturedError) {
        if (!this.didUnmount) {
          const error = new GameUpdateError("an error occurred while updating the game state", capturedError);
          this.setState({ error });
        }
        return false;
      }
    });

    stoppedPromise.finally(() => {
      document.removeEventListener("mousemove", this.mouseMoveHandler);
      document.removeEventListener("scroll", this.scrollHandler);
    });
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
        const { className } = nateCss.nateSprite;
        el.className = [className, "nate-sprite", main, shoot].flatten().join(" ");
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

        el::toggleClass("bullet-sprite", !isBursting);
        el::toggleClass("bullet-burst-sprite", isBursting);
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

  componentDidMount() {
    super.componentDidMount();
    const { props: { onLoad, onError }, state: { preloaded, error } } = this;

    if (error) {
      this.cancelAsync.resolve($mountedWithError);
      onError?.(error);
    }
    else if (preloaded) {
      onLoad?.();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);
    const { props: { onLoad, onError }, state: { preloaded, error } } = this;

    if ((error !== prevState.error || onError !== prevProps.onError) && error) {
      this.cancelAsync.resolve($updatedWithError);
      onError?.(error);
    }
    else if ((preloaded !== prevState.preloaded || onLoad !== prevProps.onLoad) && preloaded) {
      onLoad?.();
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.cancelAsync.resolve($componentUnmounted);
  }

  renderContainer(ready) {
    const {
      container: { className: containerClass },
      nateSprite: { className: nateClass }
    } = nateCss;
    const { nate: { ref: nateRef }, bounds: { ref: groundRef } } = this.world;

    const attachGame = ready ? this.attachGame : null;
    const className = [containerClass, "nate-container"];
    if (!ready) className.push("loading");
    
    return (
      <div ref={attachGame} className={className.join(" ")}>
        <div className={`${containerClass} buffer top`} />
        <div ref={groundRef} className={`${containerClass} ground-plane`} />
        <div className={`${containerClass} buffer bottom`} />
        <div ref={nateRef} className={`${nateClass} nate-sprite despawned`} />
        {this.renderBullets()}
      </div>
    );
  }

  renderBullets() {
    const { className } = nateCss.bulletSprite;
    return this.world.bullets.flatMap((bullet, x) => bullet.nodes.map((node, y) => {
      return <div key={`${x}.${y}`} ref={node.ref} className={`${className} node-${y + 1} despawned`} />;
    }));
  }

  renderImages() {
    return (
      <Preloader onLoad={this.onImagesReady} onError={this.onImagesFailed} display={false} once>
        <SpriteNate /><SpriteBullet /><SpriteBulletBurst />
      </Preloader>
    );
  }

  renderSounds() {
    const { nate, bullets } = this.world;
    return (
      <Preloader onLoad={this.onSoundsReady} onError={this.onSoundsFailed} display={false} once>
        <Audio audioRef={nate.sounds[tracks.bark].ref}><OggBowWow /><Mp3BowWow /></Audio>
        <Audio audioRef={nate.sounds[tracks.aroo].ref}><OggAroo /><Mp3Aroo /></Audio>
        <Audio audioRef={nate.sounds[tracks.land].ref}><OggLand /><Mp3Land /></Audio>
        {bullets.map((bullet, i) => (
          <Fragment key={i}>
            <Audio audioRef={bullet.sounds[tracks.spawned].ref}><OggPew /><Mp3Pew /></Audio>
            <Audio audioRef={bullet.sounds[tracks.hit].ref}><OggPop1 /><Mp3Pop1 /></Audio>
            <Audio audioRef={bullet.sounds[tracks.timedOut].ref}><OggPop2 /><Mp3Pop2 /></Audio>
          </Fragment>
        ))}
      </Preloader>
    );
  }

  render() {
    const { imagesReady, soundsReady, error } = this.state;
    const { container, nateSprite, bulletSprite } = nateCss;

    if (error) return null;

    const ready = imagesReady && soundsReady;

    return (
      <div className={`${container.className} root`}>
        <LoadingSpinner size="2x" fadeTime={fadeTime} show={!ready} background />
        {this.renderContainer(ready)}
        {this.renderImages()}
        {this.renderSounds()}
        {nateSprite.styles}
        {bulletSprite.styles}
        {container.styles}
      </div>
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

const nateCss = dew(() => {
  const nateSize = [52, 52];
  const nateOffset = [-26, 5];
  const bulletSize = [9, 9];
  const bulletBurstSize = [17, 17];
  const [margin, marginUnit] = numeric(styleVars.size["element-margin"]);

  const spriteRendering = `
    image-rendering: -moz-crisp-edges;
    image-rendering: -o-crisp-edges;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    -ms-interpolation-mode: nearest-neighbor;
  `;

  const frame = ([width, height], frameX, frameY) =>
    `background-position: ${frameX * -width}px ${frameY * -height}px;`;

  const row = ([, height], row) =>
    `background-position-y: ${height * -row}px;`;

  const col = ([width,], col) =>
    `background-position-x: ${width * -col}px;`;

  const size = ([width, height]) =>
    `width: ${width}px; height: ${height}px;`;

  const translateOffset = ([offX, offY]) =>
    `translate(${offX}px, ${offY}px)`;

  const translateCenter = ([width, height]) =>
    translateOffset([-Math.ceil(width * 0.5), Math.ceil(height * 0.5)]);

  const container = css.resolve`
    .root {
      position: relative;
      margin: ${-margin}${marginUnit} ${-margin}${marginUnit} 0${marginUnit};
    }

    .nate-container {
      overflow: visible !important;
      position: relative;
      z-index: 0;
      opacity: 1;
      transition: opacity ${fadeTime}ms ease-in-out;
    }

    .nate-container.loading {
      opacity: 0;
    }

    .buffer {
      visibility: hidden;
      width: 100%;
    }

    .buffer.top { height: ${3 * margin}${marginUnit}; }
    .buffer.bottom { height: ${margin}${marginUnit}; }

    .ground-plane {
      width: 100%;
      height: 24px;

      z-index: 0;
      border: 1px solid #004A7F;
      background-color: #0094FF;
    }
  `;

  const nateSprite = css.resolve`
    @keyframes run-cycle {
      0% { ${col(nateSize, 0)} }
      100% { ${col(nateSize, 6)} }
    }

    @keyframes jump-cycle {
      0% { ${col(nateSize, 0)} }
      100% { ${col(nateSize, 1)} }
    }

    @keyframes fall-cycle {
      0% { ${col(nateSize, 3)} }
      100% { ${col(nateSize, 4)} }
    }

    .nate-sprite {
      ${spriteRendering}
      ${size(nateSize)}
      position: absolute;
      z-index: 3;
      background: url('${SpriteNate.src}');
      transform: ${translateOffset(nateOffset)};
    }

    .idle { ${frame(nateSize, 0, 0)} }
    .idle.look-up { ${frame(nateSize, 1, 0)} }

    .idle.shoot-up { ${frame(nateSize, 4, 0)} }
    .idle.shoot-up.recoil { ${frame(nateSize, 5, 0)} }

    .idle.shoot-side { ${frame(nateSize, 2, 0)} }
    .idle.shoot-side.recoil { ${frame(nateSize, 3, 0)} }

    .idle.land { ${frame(nateSize, 5, 4)} }
    .idle.land.shoot-side { ${frame(nateSize, 5, 5)} }
    .idle.land.shoot-up { ${frame(nateSize, 5, 6)} }
    .idle.land.shoot-down { ${frame(nateSize, 5, 7)} }

    .run {
      animation: run-cycle 0.75s steps(6) infinite;
      ${row(nateSize, 1)}
    }

    .run.shoot-side { ${row(nateSize, 2)} }
    .run.shoot-up { ${row(nateSize, 3)} }

    .jump {
      animation: jump-cycle 0.125s steps(1) 1 forwards;
      ${row(nateSize, 4)}
    }

    .jump.apex {
      animation: none;
      ${col(nateSize, 2)}
    }

    .jump.fall { animation: fall-cycle 0.125s steps(1) 1 forwards; }

    .jump.shoot-side { ${row(nateSize, 5)} }
    .jump.shoot-up { ${row(nateSize, 6)} }
    .jump.shoot-down { ${row(nateSize, 7)} }

    .mirror { transform: ${translateOffset(nateOffset)} scale(-1.0, 1.0); }

    .despawned { display: none; }
  `;

  const bulletSprite = css.resolve`
    @keyframes bullet-flight {
      0% { ${col(bulletSize, 0)} }
      100% { ${col(bulletSize, 2)} }
    }

    @keyframes bullet-burst {
      0% { ${row(bulletBurstSize, 0)} }
      100% { ${row(bulletBurstSize, 1)} }
    }

    .bullet-sprite {
      ${spriteRendering}
      ${size(bulletSize)}
      position: absolute;
      background: url('${SpriteBullet.src}');
      transform: ${translateCenter(bulletSize)};
      animation: bullet-flight 0.2s steps(2) infinite;
    }

    .node-1 { z-index: 7; }
    .node-2 { z-index: 6; ${row(bulletSize, 1)} }
    .node-3 { z-index: 5; ${row(bulletSize, 2)} }

    .bullet-burst-sprite {
      ${spriteRendering}
      ${size(bulletBurstSize)}
      position: absolute;
      z-index: 4;
      background: url('${SpriteBulletBurst.src}');
      transform: ${translateCenter(bulletBurstSize)};
      animation: bullet-burst 0.075s steps(1) 1 forwards;
    }

    .despawned { display: none; }
  `;

  return { container, nateSprite, bulletSprite };
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
