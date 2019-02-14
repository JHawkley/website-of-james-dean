import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons/faSpinner";
import { dew, is } from "tools/common";
import { memoize } from "tools/functions";
import { AbortedError, Task, wait, frameSync } from "tools/async";
import { extensions as propTypesEx } from "tools/propTypes";
import { values, mainCss, resolvePositionCss } from "styles/jsx/components/LoadingSpinner";

const $componentUnmounted = "component unmounted";

const mustBePositive = (v) => v >= 0 ? true : "must be a positive number";
const mustBeFinite = (v) => v::is.finite() ? true : "must be a finite number";

class LoadingSpinner extends React.PureComponent {

  static propTypes = {
    fixed: PropTypes.bool,
    hPos: PropTypes.oneOf(Object.values(values.hPos)),
    hOffset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    vPos: PropTypes.oneOf(Object.values(values.vPos)),
    vOffset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    className: PropTypes.string,
    style: PropTypes.object,
    size: PropTypes.oneOf(["xs", "sm", "lg", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
    background: PropTypes.bool,
    delay: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.number
        ::propTypesEx.predicate(mustBePositive)
        ::propTypesEx.predicate(mustBeFinite)
    ]),
    fadeTime:
      PropTypes.number
      ::propTypesEx.predicate(mustBePositive)
      ::propTypesEx.predicate(mustBeFinite),
    show: PropTypes.bool,
    onShown: PropTypes.func,
    onHidden: PropTypes.func
  };

  static defaultProps = {
    fixed: false,
    hPos: values.hPos.center,
    hOffset: "2rem",
    vPos: values.vPos.middle,
    vOffset: "2rem",
    size: "1x",
    background: false,
    delay: true,
    fadeTime: 0,
    show: true
  };

  static getDerivedStateFromProps(props, state) {
    return !props.show && state.shown ? { shown: false, vanishing: true } : null;
  }

  state = {
    shown: !this.props.delay && this.props.show,
    vanishing: false,
    error: null
  };

  didUnmount = false;

  showTask = dew(() => {
    const showSpinner = async (stopSignal) => {
      if (this.state.vanishing) {
        // Abort the vanishing.
        await this.promiseState({ shown: true, vanishing: false });
      }
      else {
        // Wait for the delay, then show.
        const { delay } = this.props;
        if (delay === true) await frameSync(stopSignal);
        else if (delay::is.number() && delay > 0) await wait(delay, stopSignal);
        await this.promiseState({ shown: true });
      }
    };

    return new Task(showSpinner, () => this.vanishTask.whenStarted);
  });

  vanishTask = dew(() => {
    const clearVanish = async (stopSignal) => {
      // Wait for the spinner to fade, then clear the flag.
      const { fadeTime } = this.props;
      if (fadeTime > 0) await wait(fadeTime, stopSignal);
      await this.promiseState({ vanishing: false });
    };

    return new Task(clearVanish, () => this.showTask.whenStarted);
  });

  captureAsyncError = (error) => {
    if (this.didUnmount) return;
    if (error instanceof AbortedError) return;
    this.setState({ error });
  }

  memoizedPositionCss = memoize(resolvePositionCss);

  beginShow() {
    if (this.state.shown) return;
    this.showTask.restart().catch(this.captureAsyncError);
  }

  beginVanish() {
    if (!this.state.vanishing) return;
    this.vanishTask.restart().catch(this.captureAsyncError);
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

    let doShow = false, doVanish = false;

    if (error !== prevState.error && error)
      throw error;

    if (show !== prevProps.show && show)
      if (!shown)
        doShow = true;

    if (shown !== prevState.shown && shown)
      if (!prevState.vanishing)
        this.props.onShown?.();

    if (vanishing !== prevState.vanishing) {
      if (vanishing) doVanish = true;
      else if (!show && !shown) this.props.onHidden?.();
    }

    // Refresh the delay.
    if (delay !== prevProps.delay)
      doShow = show && !shown;

    // Refresh the fade-out.
    if (fadeTime !== prevProps.fadeTime)
      doVanish = vanishing;

    if (doShow) this.beginShow();
    else if (doVanish) this.beginVanish();
  }

  componentWillUnmount() {
    // Cancel asynchronous operations.
    this.didUnmount = true;
    this.showTask.stop($componentUnmounted);
    this.vanishTask.stop($componentUnmounted);
  }

  render() {
    const {
      props: {
        className: customClass, style, size, background, show,
        fixed, fadeTime, hPos, hOffset, vPos, vOffset
      },
      state: { shown, vanishing, error }
    } = this;

    if (error) return null;

    const isDisplayed = show || shown || vanishing;
    const positionCss = this.memoizedPositionCss(fixed, fadeTime, hPos, hOffset, vPos, vOffset);
    const className = [
      customClass,
      mainCss.className,
      positionCss.className,
      background && "bg",
      shown && "is-shown",
      isDisplayed && "is-displayed"
    ].filter(Boolean).join(" ");

    return (
      <div className={className} style={style}>
        <FontAwesomeIcon icon={faSpinner} size={size === "1x" ? null : size} spin />
        {mainCss.styles}
        {positionCss.styles}
      </div>
    );
  }

}

export default LoadingSpinner;