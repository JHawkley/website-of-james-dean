import { css } from "styled-jsx/css";

const fluidCss = css`
  .fluid-container {
    display: block !important;
    position: relative !important;
    max-width: 100% !important;
  }

  /* Fixes image overlay with .fluid-container. */
  .fluid-container :global(.image:before) {
    z-index: 1;
  }
  
  .fluid {
    position: absolute !important;
    top: 0px !important;
    left: 0px !important;
    width: 100% !important;
    height: 100% !important;
    max-width: inherit !important;
  }
`;

const fluidMargin = ({width, height}) => css.resolve`
  .fluid-container {
    width: ${width}px;
    paddingBottom: ${100.0 / (width / height)}%;
  }
`;

export { fluidCss, fluidMargin };