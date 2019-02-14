import { css } from "styled-jsx/css";
import { memoize } from "tools/functions";
import { timespan } from "tools/css";
import resolvedEmpty from "styles/jsx/lib/resolvedEmpty";
import styleVars from "styles/vars.json";

const exitDelay = timespan(styleVars["duration"]["article"]);

const resolveDelayCss = memoize((exitDelay) => {
  if (!exitDelay || exitDelay <= 0) return resolvedEmpty;
  return css.resolve`
    * > :global(article) {
      transition:
        opacity ${exitDelay}ms ease-in-out,
        transform ${exitDelay}ms ease-in-out;
    }
  `;
});

export { exitDelay, resolveDelayCss };