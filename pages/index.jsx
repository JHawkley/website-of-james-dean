import PropTypes from "prop-types";
import { Fragment } from "react";
import { css } from "styled-jsx/css";
import { color } from "tools/css";
import { faCode } from "@fortawesome/free-solid-svg-icons/faCode";
import Background from "components/Background";
import Header from "components/Header";
import Footer from "components/Footer";
import Jump from "components/Jump";
import styleVars from "styles/vars.json";
import { resolveDelayCss } from "styles/jsx/index-page";

import $intro from "pages/intro?route";
import $work from "pages/work/index?route";
import $questions from "pages/questions?route";
import $contact from "pages/contact?route";

const backgroundColor = color(styleVars["palette"]["bg"]).transparentize(0.15).asRgba();

const Index = ({transitionClass, blurBackground}) => {
  const bgClass = blurBackground ? "blur" : null;
  const headerClass = [transitionClass, customHeaderCss.className].filter(Boolean).join(" ");
  const footerClass = transitionClass;

  return (
    <Fragment>
      <Fragment key="content">
        <Header className={headerClass} logo={faCode}>
          <Header.Content>
            <h1>A Programmer's Place</h1>
            <p>My name is James Dean; this is a place to get to know me<br />
            and get more information on the works I've done.</p>
          </Header.Content>
          <Header.Nav>
            <Jump href={$intro}>Intro</Jump>
            <Jump href={$work}>Work</Jump>
            <Jump href={$questions}>Q&amp;A</Jump>
            <Jump href={$contact}>Contact</Jump>
          </Header.Nav>
        </Header>
        <Footer className={footerClass}>
          <p className="copyright">Template: &copy; <Jump href="https://github.com/codebushi/nextjs-starter-dimension" icon="none">Next.js Starter - Dimension</Jump>.  Content: &copy; James Dean</p>
          <p className="copyright">Design: <Jump href="https://html5up.net" icon="none">HTML5 UP</Jump>.  Built with: <Jump href="https://github.com/zeit/next.js" icon="none">Next.js</Jump></p>
        </Footer>
        {customHeaderCss.styles}
      </Fragment>
      <Background key="background" className={bgClass} />
    </Fragment>
  );
}

Index.propTypes = {
  transitionClass: PropTypes.string,
  blurBackground: PropTypes.bool
};

Index.transition = {
  // eslint-disable-next-line react/display-name
  render(Component, props, exitDelay, stage) {
    const isExiting = stage === "exiting" || stage === "exited";
    const isHidden = stage === "exited" || stage === "entering";
    const delayCss = resolveDelayCss(exitDelay);

    const transitionClass = [
      delayCss.className,
      isExiting && "is-exiting",
      isHidden && "is-hidden"
    ].filter(Boolean).join(" ");

    return (
      <Fragment>
        <Component
          {...props}
          transitionClass={transitionClass}
          blurBackground={isExiting || isHidden}
        />
        {delayCss.styles}
      </Fragment>
    );
  }
};

const customHeaderCss = css.resolve`
  /* Personal site customization. */
  * {
    border-radius: 4px;
    padding: 1.5rem;
    background-color: ${backgroundColor};
  }
`;

export default Index;