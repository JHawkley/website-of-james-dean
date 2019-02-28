import React, { Fragment } from "react";
import { is } from "tools/common";
import PropTypes, { extensions as propEx } from "tools/propTypes";
import { memoize } from "tools/functions";
import RouterContext from "lib/RouterContext";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons/faArrowLeft";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faRedo } from "@fortawesome/free-solid-svg-icons/faRedo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Background from "components/Background";
import { exitDelay, resolveDelayCss } from "styles/jsx/components/Page";

const $navLeft = "nav-left";
const $navRight = "nav-right";
const $none = "none";
const $reload = "reload";
const $back = "back";
const $index = "index";

const canNavigate = (value) => Boolean(value?.navigateTo::is.func());

class Page extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    transitionClass: PropTypes.string,
    navLeft: PropTypes.oneOfType([
      PropTypes.func::propEx.predicate(canNavigate),
      PropTypes.oneOf([$none, $reload, $back]),
      PropTypes.string::propEx.reject([$index])
    ]),
    navRight: PropTypes.oneOfType([
      PropTypes.func::propEx.predicate(canNavigate),
      PropTypes.oneOf([$none, $index]),
      PropTypes.string::propEx.reject([$back, $reload])
    ])
  };

  static defaultProps = {
    navLeft: $none,
    navRight: $index
  };

  static contextType = RouterContext;

  /**
   * The default transition configuration for all pages.  The `pages/_app` component uses this as defaults in case
   * any transition configuration is missing from a page-component.
   */
  static transition = {
    /**
     * The expected amount of time it takes for the page to transition out.
     * 
     * @type {number}
     */
    exitDelay,

    /**
     * A function that will render the component according to the current transition state.
     * See `components/Transition` for information on how it will be used.
     * 
     * @param {Function} Component
     *   The component to render.
     * @param {Object} props
     *   The props to be provided to `Component` when rendered.
     * @param {number} exitDelay
     *   The amount of time the exit-transition is expected to take.
     * @param {"exiting" | "exited" | "entered" | "entering"} stage
     *   The current stage of the transition:
     *   * "exiting" - This `Component` is transitioning out.
     *   * "exited" - This `Component` has transitioned out and should now no longer be displayed to the user.
     *   * "entered" - This `Component` should be prepared for its transition in.
     *   * "entering" - This `Component` should now be transitioning in.
     */
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

  /**
   * Creates an instance of the `Page` component.
   *
   * @param {Object} props
   *   The properties to apply to the component.
   * @param {*} props.children
   *   The children to render into the `.page > article` element.
   * @param {string} [props.id]
   *   The ID of the `.page > article` element.
   * @param {string} [props.className]
   *   The class to apply to the `.page > article` element.
   * @param {Object} [props.style]
   *   A style object to apply to the `.page > article` element.
   * @param {string} [props.transitionClass]
   *   A class to apply to the container `.page` element, for the purpose of handling transitions.
   *   See `Page.transition` for more information.
   * @param {("none" | "reload" | "back" | RouteObject | string)} [props.navLeft="none"]
   *   What to display for the left-hand navigation button.
   * 
   *   Can be one of:
   *   * "none" - Does not render the button.
   *   * "reload" - Displays a circular arrow and reloads the page when clicked.
   *   * "back" - Displays a left-facing arrow and will navigate the browser back when clicked.
   *   * (RouteObject) - Displays a left-facing arrow and will navigate to the provided route when clicked.
   *   * (string) - Displays a left-facing arrow and will navigate to the provided path when clicked.
   * @param {("none" | "index" | RouteObject | string)} [props.navRight="index"]
   *   What to display for the right-hand navigation button.
   * 
   *   Can be one of:
   *   * "none" - Does not render the button.
   *   * "index" - Displays a cross and will navigate to the top-most index.
   *   * (RouteObject) - Displays a cross and will navigate to the provided route when clicked.
   *   * (string) - Displays a cross and will navigate to the provided path when clicked.
   * @memberof Page
   */
  constructor(props) {
    super(props);
  }

  renderLeftNavButton = memoize((router, target) => 
    <NavButton router={router} className={$navLeft} target={target} />
  );

  renderRightNavButton = memoize((router, target) =>
    <NavButton router={router} className={$navRight} target={target} />
  );

  render() {
    const {
      id, style, children,
      className: articleClass, transitionClass,
      navLeft, navRight
    } = this.props;
  
    const className = transitionClass ? `page ${transitionClass}` : "page";
  
    return (
      <Fragment>
        <div className={className}>
          <article id={id} className={articleClass} style={style}>
            {this.renderLeftNavButton(this.context, navLeft)}
            {this.renderRightNavButton(this.context, navRight)}
            {children}
          </article>
          <Background.Controller className="blur" />
        </div>
      </Fragment>
    );
  }

}

const NavButton = ({router, className, target}) => {
  if (!router) return null;
  if (target === $none) return null;

  const onClick = determineOnClick(router, target);

  if (!onClick) return null;

  const icon
    = className === $navRight ? faTimes
    : target === $reload ? faRedo
    : faArrowLeft;
  
  return (
    <div onClick={onClick} className={className}>
      <div className="nav-button">
        <FontAwesomeIcon icon={icon} size="lg" />
      </div>
    </div>
  );
};

NavButton.propTypes = {
  router: PropTypes.any,
  className: PropTypes.oneOf([$navLeft, $navRight]).isRequired,
  target: PropTypes.oneOfType([
    PropTypes.func::propEx.predicate(canNavigate),
    PropTypes.oneOf([$none, $back, $reload, $index]),
    PropTypes.string
  ]).isRequired
};

const determineOnClick = (router, target) => {
  switch (target) {
    case $reload: return router.reload;
    case $back: return router.back;
    case $index: return router.navigateToIndex;
    default:
      if (target?.navigateTo::is.func())
        return () => target.navigateTo(router);
      else if (target::is.string())
        return () => router.navigateTo(target);
      else
        return null;
  }
}

export default Page;

/**
 * An object produced by `webpack/jump-loader`; represents a route's information.
 * @typedef {{navigateTo: Function}} RouteObject
 */