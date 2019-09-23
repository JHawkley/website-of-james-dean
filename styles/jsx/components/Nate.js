import css from "styled-jsx/css";
import { numeric } from "tools/css";
import styleVars from "styles/vars.json";

// The amount of time in milliseconds to fade in/out when transitioning to/from loaded states.
const fadeTime = 325;

const groundThickness = 24;
const [margin, marginUnit] = numeric(styleVars["size"]["element-margin"]);

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
    box-sizing: content-box !important;
    overflow: visible !important;
    position: relative;
    z-index: 0;
    opacity: 1;
    transition: opacity ${fadeTime}ms ease-in-out;

    width: 100%;
    height: ${groundThickness}px;
    padding-top: ${3 * margin}${marginUnit};
    padding-bottom: ${margin}${marginUnit};
  }

  *.loading { opacity: 0; }

  * > :global(.ground-plane) {
    width: 100%;
    height: 100%;

    z-index: 0;
    border: 1px solid #004A7F;
    background-color: #0094FF;
  }
`;

export { fadeTime, componentCss, containerCss };