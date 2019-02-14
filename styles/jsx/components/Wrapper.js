import { css } from "styled-jsx/css";
import resolvedEmpty from "styles/jsx/lib/resolvedEmpty";

const resolveScrollCss = (scroll) => {
  if (!scroll) return resolvedEmpty;
  return css.resolve`
    * {
      margin-top: -${scroll.y}px;
    }

    :global(.ReactModal__Body--open) {
      position: fixed;
      width: 100%;
      height: 100%;
    }
  `;
}

export { resolveScrollCss };