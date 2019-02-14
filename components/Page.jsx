import { Fragment } from "react";
import PropTypes from "prop-types";
import { memoize } from "tools/functions";
import RouterContext from "lib/RouterContext";
import Background from "components/Background";
import { exitDelay, resolveDelayCss } from "styles/jsx/components/Page";

const Page = (props) => {
  const {
    id, style, children,
    className: articleClass, transitionClass
  } = props;

  const className = transitionClass ? `page ${transitionClass}` : "page";

  return (
    <Fragment>
      <div key="content" className={className}>
        <article id={id} className={articleClass} style={style}>
          <RouterContext.Consumer>
            {renderRouterContext}
          </RouterContext.Consumer>
          {children}
        </article>
      </div>
      <Background key="background" className="blur" />
    </Fragment>
  );
}

Page.propTypes = {
  children: PropTypes.node,
  id: PropTypes.string,
  className: PropTypes.string,
  transitionClass: PropTypes.string,
  style: PropTypes.object
};

Page.transition = {
  exitDelay,
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
        <Component {...props} transitionClass={transitionClass} />
        {delayCss.styles}
      </Fragment>
    );
  }
};

const renderRouterContext = memoize((router) => {
  if (!router) return null;
  return (
    <Fragment>
      <div onClick={router.upLevel} className="back" />
      <div onClick={router.upToIndex} className="close" />
    </Fragment>
  );
});

export default Page;