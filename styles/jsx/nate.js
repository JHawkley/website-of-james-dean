import { css } from "styled-jsx/css";
import { numeric } from "tools/css";
import styleVars from "styles/vars.json";

import ImgNate from "static/images/nate-game/nate_sprite.png";
import ImgBullet from "static/images/nate-game/bullet_sprite.png";
import ImgBulletBurst from "static/images/nate-game/bullet_burst_sprite.png";

// The amount of time in milliseconds to fade in/out when transitioning to/from loaded states.
const fadeTime = 325;

const nateSize = [52, 52];
const nateOffset = [-26, 5];
const bulletSize = [9, 9];
const bulletBurstSize = [17, 17];
const [margin, marginUnit] = numeric(styleVars["size"]["element-margin"]);

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

const componentCss = css.resolve`
  * {
    position: relative;
    margin: ${-margin}${marginUnit} ${-margin}${marginUnit} 0${marginUnit};
  }

  /* 
   * Prevents bullets from causing scroll-bars to appear as they
   * fly off the edge of the screen.
   */
  :global(.app-root > .app-container) {
    position: relative;
    overflow: hidden;
  }
`;

const containerCss = css.resolve`
  * {
    overflow: visible !important;
    position: relative;
    z-index: 0;
    opacity: 1;
    transition: opacity ${fadeTime}ms ease-in-out;
  }

  *.loading {
    opacity: 0;
  }

  * > :global(.buffer) {
    visibility: hidden;
    width: 100%;
  }

  * > :global(.buffer.top) { height: ${3 * margin}${marginUnit}; }
  * > :global(.buffer.bottom) { height: ${margin}${marginUnit}; }

  * > :global(.ground-plane) {
    width: 100%;
    height: 24px;

    z-index: 0;
    border: 1px solid #004A7F;
    background-color: #0094FF;
  }
`;

const nateSpriteCss = css.resolve`
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

  * {
    ${spriteRendering}
    ${size(nateSize)}
    position: absolute;
    z-index: 3;
    background: url('${ImgNate.src}');
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

const bulletSpriteCss = css.resolve`
  @keyframes bullet-flight {
    0% { ${col(bulletSize, 0)} }
    100% { ${col(bulletSize, 2)} }
  }

  @keyframes bullet-burst {
    0% { ${row(bulletBurstSize, 0)} }
    100% { ${row(bulletBurstSize, 1)} }
  }

  .bullet {
    ${spriteRendering}
    ${size(bulletSize)}
    position: absolute;
    background: url('${ImgBullet.src}');
    transform: ${translateCenter(bulletSize)};
    animation: bullet-flight 0.2s steps(2) infinite;
  }

  .node-1 { z-index: 7; }
  .node-2 { z-index: 6; ${row(bulletSize, 1)} }
  .node-3 { z-index: 5; ${row(bulletSize, 2)} }

  .bullet-burst {
    ${spriteRendering}
    ${size(bulletBurstSize)}
    position: absolute;
    z-index: 4;
    background: url('${ImgBulletBurst.src}');
    transform: ${translateCenter(bulletBurstSize)};
    animation: bullet-burst 0.075s steps(1) 1 forwards;
  }

  .despawned { display: none; }
`;

export { ImgNate, ImgBullet, ImgBulletBurst }
export { fadeTime, componentCss, containerCss, nateSpriteCss, bulletSpriteCss };