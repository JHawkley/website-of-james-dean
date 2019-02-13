import { css } from "styled-jsx/css";

const fluidCss = css.resolve`
  * {
    display: block !important;
    position: relative !important;
    max-width: 100% !important;
  }
  
  img {
    position: absolute !important;
    top: 0px !important;
    left: 0px !important;
    width: 100% !important;
    height: 100% !important;
    max-width: inherit !important;
  }

  /* These fix the grainy image overlay. */
  :global(.image) * {
    z-index: -1;
  }

  * :global(.image:before) {
    z-index: 1;
  }
`;

const resolveMarginCss = (width, height) => css.resolve`
  * {
    width: ${width}px;
    padding-bottom: ${100.0 / (width / height)}%;
  }
`;

export { fluidCss, resolveMarginCss };