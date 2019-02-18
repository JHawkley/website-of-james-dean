import React from "react";
import PropTypes from "prop-types";
import BackgroundContext from "lib/BackgroundContext";
import Preloadable from "components/Preloadable";
import { extensions as asyncEx, Future, preloadImage } from "tools/async";
import { dequote } from "tools/css";
import styleVars from "styles/vars.json";

const bgImageSrc = dequote(styleVars["misc"]["bg-image"]);
const imgOverlaySrc = dequote(styleVars["misc"]["img-overlay"]);

class Background extends Preloadable {

  static propTypes = {
    className: PropTypes.string
  };

  whenUnmounted = new Future();

  componentDidMount() {
    super.componentDidMount();

    const options = { abortSignal: this.whenUnmounted.promise };
    const imgPromise = preloadImage(bgImageSrc, options);
    const overlayPromise = preloadImage(imgOverlaySrc, options);

    Promise.all([imgPromise, overlayPromise])
      .then(this.handlePreloaded)
      ::asyncEx.voidOnAbort()
      .catch(this.handlePreloadError);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.whenUnmounted.resolve();
  }

  stateClassName() {
    const { error, preloaded } = this.state;
    if (error) return "bg-error";
    if (!preloaded) return "bg-loading";
    return null;
  }

  render() {
    const { className: customClass } = this.props;
    const className = [customClass, this.stateClassName()].filter(Boolean).join(" ") || null;

    return <div id="bg" className={className} />;
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