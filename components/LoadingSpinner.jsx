import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons/faSpinner";
import { dew, is } from "tools/common";
import { color } from "tools/css";
import { CallSync, AbortedError, wait as asyncWait } from "tools/async";
import { abortionReason } from "tools/extensions/async";
import { extensions as propTypesEx } from "tools/propTypes";
import styleVars from "styles/vars.json";

const bgColor = color(styleVars.palette.bg).transparentize(0.15).asRgba();

const $left = "left";
const $center = "center";
const $right = "right";
const $top = "top";
const $middle = "middle";
const $bottom = "bottom";

const $componentUnmounted = "component unmounted";
const $nowShowing = "now showing";
const $nowVanishing = "now vanishing";

const mustBePositive = (v) => v >= 0 ? true : "must be a positive number";

class LoadingSpinner extends React.PureComponent {

  static propTypes = {
    fixed: PropTypes.bool,
    hPos: PropTypes.oneOf([$center, $left, $right]),
    hOffset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    vPos: PropTypes.oneOf([$middle, $top, $bottom]),
    vOffset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    className: PropTypes.string,
    style: PropTypes.object,
    size: PropTypes.oneOf(["xs", "sm", "lg", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
    background: PropTypes.bool,
    delay: PropTypes.number::propTypesEx.predicate(mustBePositive),
    fadeTime: PropTypes.number::propTypesEx.predicate(mustBePositive),
    show: PropTypes.bool,
    onShown: PropTypes.func,
    onHidden: PropTypes.func
  };

  static defaultProps = {
    fixed: false,
    hPos: $center,
    hOffset: "2rem",
    vPos: $middle,
    vOffset: "2rem",
    size: "1x",
    background: false,
    delay: 0,
    fadeTime: 0,
    show: true
  };

  static getDerivedStateFromProps(props, state) {
    return !props.show && state.shown ? { shown: false, vanishing: true } : null;
  }

  state = {
    shown: this.props.delay === 0 && this.props.show,
    vanishing: false,
    error: null
  };

  didUnmount = false;

  cancelAsync = new CallSync((p) => {
    if (this.didUnmount)
      throw new AbortedError($componentUnmounted)
    return p::abortionReason();
  });

  async beginShow() {
    try {
      if (this.state.shown) return;

      // Cancel any other async operations.
      this.cancelAsync.resolve($nowShowing);
      
      if (this.state.vanishing) {
        // Abort the vanishing.
        await this.promiseState({ shown: true, vanishing: false });
      }
      else {
        // Wait for the delay, then show.
        const { delay } = this.props;
        if (delay > 0) {
          await this.wait(delay);
          if (this.state.shown) return;
        }
        await this.promiseState({ shown: true });
        this.props.onShown?.();
      }
    }
    catch (error) {
      if (error instanceof AbortedError) return;
      this.setState({ error });
      throw error;
    }
  }

  async clearVanish() {
    try {
      if (!this.state.vanishing) return;

      // Cancel any other async operations.
      this.cancelAsync.resolve($nowVanishing);

      const { fadeTime } = this.props;
      if (fadeTime > 0) {
        await this.wait(fadeTime);
        if (!this.state.vanishing) return;
      }
      await this.promiseState({ vanishing: false });
      this.props.onHidden?.();
    }
    catch (error) {
      if (error instanceof AbortedError) return;
      this.setState({ error });
      throw error;
    }
  }

  wait(delay) {
    return asyncWait(delay, this.cancelAsync.sync);
  }

  promiseState(newState) {
    return new Promise((resolve, reject) => {
      if (this.didUnmount) return reject(new AbortedError($componentUnmounted));
      this.setState(newState, resolve);
    });
  }

  componentDidMount() {
    if (this.props.show) this.beginShow();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      props: { show, delay, fadeTime },
      state: { shown, vanishing, error }
    } = this;

    if (error !== prevState.error && error)
      throw error;

    let doShow = show !== prevProps.show && show && !shown;
    let doVanish = vanishing !== prevState.vanishing && vanishing;

    // Refresh the delay.
    if (delay !== prevProps.delay)
      doShow = show && !shown;

    // Refresh the fade-out.
    if (fadeTime !== prevProps.fadeTime)
      doVanish = vanishing;

    if (doShow) this.beginShow();
    else if (doVanish) this.clearVanish();
  }

  componentWillUnmount() {
    // Cancel asynchronous operations.
    this.didUnmount = true;
    this.cancelAsync.resolve($componentUnmounted);
  }

  render() {
    const {
      props: { className: customClass, style: customStyle, size, fixed, background, fadeTime, show },
      state: { shown, vanishing, error }
    } = this;

    if (error) return null;

    const className = ["root"];
    if (customClass) className.push(customClass);
    if (background) className.push("bg");

    const style = {
      ...customStyle,
      opacity: shown ? 1 : 0,
      display: show || shown || vanishing ? "block" : "none"
    };

    const transform = dew(() => {
      const { hPos, vPos } = this.props;
      if (hPos !== $center && vPos !== $middle) return "none";
      const xTrans = hPos === $center ? "-50%" : "0%";
      const yTrans = vPos === $middle ? "-50%" : "0%";
      return `translate(${xTrans}, ${yTrans})`;
    });

    const [horizAttr, horizVal] = dew(() => {
      const { hPos, hOffset } = this.props;
      const offset = hOffset::is.string() ? hOffset : `${hOffset}px`;
      switch (hPos) {
        case $left: return [$left, offset];
        case $right: return [$right, offset];
        default: return [$left, "50%"];
      }
    });

    const [vertAttr, vertVal] = dew(() => {
      const { vPos, vOffset } = this.props;
      const offset = vOffset::is.string() ? vOffset : `${vOffset}px`;
      switch (vPos) {
        case $top: return [$top, offset];
        case $bottom: return [$bottom, offset];
        default: return [$top, "50%"];
      }
    });

    return (
      <div className={className.join(" ")} style={style}>
        <FontAwesomeIcon icon={faSpinner} size={size === "1x" ? null : size} spin />
        <style jsx>
          {`
            .root {
              pointer-events: none;
              opacity: 0;
            }
            .bg {
              border-radius: 4px;
              padding: 1.5rem;
              background-color: ${bgColor};
            }
          `}
        </style>
        <style jsx>
          {`
            .root {
              position: ${fixed ? "fixed" : "absolute"};
              ${fadeTime > 0 ? `transition: opacity ${fadeTime}ms ease-in-out;` : ""}
              transform: ${transform};
              ${horizAttr}: ${horizVal};
              ${vertAttr}: ${vertVal};
            }
          `}
        </style>
      </div>
    );
  }

}

export default LoadingSpinner;