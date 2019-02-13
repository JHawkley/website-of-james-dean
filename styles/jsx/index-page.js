import { css } from "styled-jsx/css";
import { memoize } from "tools/functions";
import { resolvedEmpty } from "styles/jsx/common";

const resolveDelayCss = memoize((exitDelay) => {
  if (!exitDelay || exitDelay <= 0) return resolvedEmpty;
  return css.resolve`
    * {
      transition:
        transform ${exitDelay}ms ease-in-out,
        filter ${exitDelay}ms ease-in-out,
        opacity ${exitDelay}ms ease-in-out;
    }
  `;
});

export { resolveDelayCss };