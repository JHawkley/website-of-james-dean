import { Fragment } from "react";
import PropTypes from "prop-types";
import { css } from "styled-jsx/css";
import { numeric } from "tools/css";
import Page from "components/Page";
import styleVars from "styles/vars.json";

const [translateVal, translateUnit] = numeric(styleVars["size"]["page-translate"]);

// Special component for rendering a page when no JavaScript is detected.
const NoJavaScriptPage = ({transitionClass}) => (
  <Page transitionClass={transitionClass} navLeft="none" navRight="none">
    <h2 className="major">JavaScript Disabled</h2>
    <p>JavaScript appears to be disabled during this visit.</p>
    <p>This site is a single-page web application and requires JavaScript to render properly.  If you wish to experience this web page, please add this domain as an exception to your browser's JavaScript blocker and then refresh the page.</p>
    <h3>Site Summary</h3>
    <p>This is the personal web site for James Dean, a programmer out of the Dallas/Fort Worth area in Texas, USA.  It showcases my work to potential employers or those otherwise interested in a programmer for a project.</p>
    <p>It is driven by the React JavaScript framework and has live JavaScript demonstrations that make use of per-frame animation; this site may, at times, consume a bit more of your device's power than the average website.</p>
    <p>I do my best to use web technologies responsibly.</p>
  </Page>
);

NoJavaScriptPage.propTypes = {
  transitionClass: PropTypes.string
};

NoJavaScriptPage.transition = {
  // eslint-disable-next-line react/display-name
  render(Component, props, exitDelay, stage) {
    const isHidden = stage === "exited" || stage === "entering";
    const transitionCss = resolveTransitionCss(exitDelay, isHidden);

    return (
      <Fragment>
        <Component {...props} transitionClass={transitionCss.className} />
        {transitionCss.styles}
      </Fragment>
    );
  }
};

const resolveTransitionCss = (exitDelay, isHidden) => {
  const visibilityVal = isHidden ? "hidden" : "unset";
  const playStateVal = isHidden ? "paused" : "running";

  return css.resolve`
    @keyframes main {
      0% {
        opacity: 0;
        transform: translateY(${translateVal}${translateUnit});
      }

      100% {
        opacity: 1;
        transform: translateY(0${translateUnit});
      }
    }

    * {
      visibility: ${visibilityVal};
      animation: main ${exitDelay}ms ease-in-out 1 forwards ${playStateVal};
    }
  `;
}

export default NoJavaScriptPage;