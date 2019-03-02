import React from "react";
import PropTypes from "prop-types";
import BackgroundContext from "lib/BackgroundContext";
import Preloadable from "components/Preloadable";
import PreloadError from "components/Preloader/PreloadError";
import { extensions as asyncEx, Future, preloadImage } from "tools/async";
import { dequote } from "tools/css";
import { asError } from "tools/extensions/errors";
import styleVars from "styles/vars.json";

const bgImageSrc = dequote(styleVars["misc"]["bg-image"]);
const imgOverlaySrc = dequote(styleVars["misc"]["img-overlay"]);

class Background extends React.PureComponent {

  static propTypes = {
    className: PropTypes.string,
    immediate: PropTypes.bool
  };

  state = {
    preloaded: Boolean(this.props.immediate),
    error: null
  };

  whenUnmounted = new Future();

  get className() {
    const {
      props: { className: customClass, immediate },
      state: { preloaded, error }
    } = this;

    if (immediate) return customClass;
    if (error) return [customClass, "bg-error"].filter(Boolean).join(" ");
    if (!preloaded) return [customClass, "bg-loading"].filter(Boolean).join(" ");
    return customClass;
  }

  handlePromiseResolved = () => {
    if (this.whenUnmounted.isCompleted) return;
    this.setState({ preloaded: true });
  }

  handlePromiseError = (reason) => {
    if (this.whenUnmounted.isCompleted) return;
    const error
      = !reason ? new PreloadError("promise rejected without a reason")
      : reason::asError();
    this.setState({ preloaded: true, error });
  }

  componentDidMount() {
    if (this.props.immediate) return;

    const options = { abortSignal: this.whenUnmounted.promise };
    const imgPromise = preloadImage(bgImageSrc, options);
    const overlayPromise = preloadImage(imgOverlaySrc, options);

    Promise.all([imgPromise, overlayPromise])
      .then(this.handlePromiseResolved)
      ::asyncEx.voidOnAbort()
      .catch(this.handlePromiseError);
  }

  componentWillUnmount() {
    this.whenUnmounted.resolve();
  }

  render() {
    const { className, state: { preloaded, error } } = this;

    return (
      <Preloadable preloaded={preloaded} error={error}>
        <div id="bg" className={className} />
      </Preloadable>
    );
  }

}

class Controller extends React.PureComponent {
    
  static propTypes = {
    className: PropTypes.string
  };

  static displayName = "Background.Controller";

  static contextType = BackgroundContext;

  componentDidMount() {
    const { className } = this.props;
    this.context.updateClassName(this, className);
  }

  componentDidUpdate(prevProps) {
    const { className } = this.props;
    if (className !== prevProps.className)
      this.context.updateClassName(this, className);
  }

  componentWillUnmount() {
    this.context.updateClassName(this, null);
  }

  render() {
    return null;
  }

}

Background.Controller = Controller;

export default Background;