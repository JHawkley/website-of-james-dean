import { css } from "styled-jsx/css";
import { is, dew } from "tools/common";
import { color } from "tools/css";
import styleVars from "styles/vars.json";

const $left = "left";
const $center = "center";
const $right = "right";

const $top = "top";
const $middle = "middle";
const $bottom = "bottom";

const bgColor = color(styleVars["palette"]["bg"]).transparentize(0.15).asRgba();

const values = {
  hPos: { left: $left, center: $center, right: $right },
  vPos: { top: $top, middle: $middle, bottom: $bottom }
};

const mainCss = css`
  .root {
    pointer-events: none;
    opacity: 0;
  }

  .bg {
    border-radius: 4px;
    padding: 1.5rem;
    background-color: ${bgColor};
  }
`;

const dynamicCss = ({fixed, fadeTime, hPos, hOffset, vPos, vOffset}) => {
  const transform = dew(() => {
    if (hPos !== $center && vPos !== $middle) return "none";
    const xTrans = hPos === $center ? "-50%" : "0%";
    const yTrans = vPos === $middle ? "-50%" : "0%";
    return `translate(${xTrans}, ${yTrans})`;
  });

  const [horizAttr, horizVal] = dew(() => {
    const offset = hOffset::is.string() ? hOffset : `${hOffset}px`;
    switch (hPos) {
      case $left: return [$left, offset];
      case $right: return [$right, offset];
      default: return [$left, "50%"];
    }
  });

  const [vertAttr, vertVal] = dew(() => {
    const offset = vOffset::is.string() ? vOffset : `${vOffset}px`;
    switch (vPos) {
      case $top: return [$top, offset];
      case $bottom: return [$bottom, offset];
      default: return [$top, "50%"];
    }
  });

  return css.resolve`
    .root {
      position: ${fixed ? "fixed" : "absolute"};
      ${fadeTime > 0 ? `transition: opacity ${fadeTime}ms ease-in-out;` : ""}
      transform: ${transform};
      ${horizAttr}: ${horizVal};
      ${vertAttr}: ${vertVal};
    }
  `;
}

export { values, mainCss, dynamicCss };