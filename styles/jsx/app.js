import { css } from "styled-jsx/css";
import { dew } from "tools/common";
import { timespan, color } from "tools/css";
import styleVars from "styles/vars.json";

const bgColor = color(styleVars["palette"]["bg"]).transparentize(0.15).asRgba();
const fontColor = color(styleVars["palette"]["fg-bold"]).asRgba();

const globalCss = css.global`
  #app-root > #app-container {
    position: relative;
    overflow: hidden;
  }

  #app-root .span-across {
    display: inline-block;
    width: 100%;
    max-width: 100%;
    margin: 0 0 ${styleVars["size"]["element-margin"]} 0;
  }

  #app-root .image .label-right {
    position: absolute;
    right: 0.875rem;
    bottom: 0.875rem;

    background-color: ${bgColor};
    border-radius: ${styleVars["size"]["border-radius"]};
    padding: 0 0.5rem;

    color: ${fontColor};
    font-weight: ${styleVars["font"]["weight-bold"]};
    font-size: 1.5rem;
    text-align: right;
  }
`;

const throbberCss = dew(() => {
  const fadeTime = timespan(styleVars["duration"]["modal"]);
  const { className, styles } = css.resolve`
    .throbber {
      z-index: 3;
    }
  `;

  return { fadeTime, className: `${className} throbber`, styles };
});

export { globalCss, throbberCss };