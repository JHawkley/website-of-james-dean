import { css } from "styled-jsx/css";
import { dew } from "tools/common";
import { timespan } from "tools/css";
import styleVars from "styles/vars.json";

const throbberCss = dew(() => {
  const fadeTime = timespan(styleVars["duration"]["modal"]);
  const { className, styles } = css.resolve`* { z-index: 3; }`;

  return { fadeTime, className, styles };
});

export { throbberCss };