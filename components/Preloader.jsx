import React from "react";
import PropTypes from "prop-types";
import PreloadContext from "lib/PreloadContext";
import PreloadSync from "components/Preloader/PreloadSync";
import { is, dew } from "tools/common";
import { Future, CallSync, AbortedError } from "tools/async";
import { predicate } from "tools/extensions/propTypes";
import { extensions as asyncIterEx } from "tools/asyncIterables";

const {
  fresh: $$fresh,
  preloading: $$preloading,
  preloaded: $$preloaded
} = PreloadSync.states;

const $always = "always";
const $loaded = "loaded";
const $never = "never";
const $naked = "naked";

const notNaked = (value, key, props) => {
  if (!value::is.defined()) return true;
  if (props.display !== $naked) return true;
  return `${key} must be unset when \`display\` is set to "naked"`;
};

class Preloader extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node.isRequired,
    promise: PropTypes.func,
    onPreload: PropTypes.func,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    id: PropTypes.string::predicate(notNaked),
    className: PropTypes.string::predicate(notNaked),
    style: PropTypes.object::predicate(notNaked),
    display: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.oneOf([$always, $loaded, $never, $naked])
    ]),
    wait: PropTypes.bool,
    once: PropTypes.bool
  };

  static defaultProps = {
    display: $loaded,
    wait: false,
    once: false
  };

  preloadedFuture = null;

  cancelAsync = new CallSync();

  preloadSync = new PreloadSync((error) => {
    const { onError } = this.props;
    if (!onError) return false;
    return onError(error, false);
  });

  state = {
    preloadState: $$fresh,
    preloadedOnce: false,
    mustRender: !this.props.wait,
    error: null
  };

  get promise() {
    if (this.preloadedFuture) return this.preloadedFuture.promise;

    const { error, preloadState } = this.state;

    if (error) return Promise.reject(error);
    if (preloadState === $$preloaded) return Promise.resolve(true);

    this.preloadedFuture = new Future();
    return this.preloadedFuture.promise;
  }

  get display() {
    switch (this.props.display) {
      case true: return $always;
      case false: return $never;
      default: return this.props.display;
    }
  }

  preloadSyncUpdated = (newPreloadState) => {
    const { props: { once }, state: { preloadedOnce, preloadState, error } } = this;
    if (once && preloadedOnce) return;
    if (preloadState === newPreloadState) return;
    if (error) return;

    const newState = { preloadState: newPreloadState };
    if (newPreloadState === $$preloaded && !preloadedOnce)
      newState.preloadedOnce = true;
    this.setState(newState);
  }

  attachToPreloadSync() {
    const { preloadSync, preloadSyncUpdated, cancelAsync } = this;
    preloadSync.updates::asyncIterEx.forEach(preloadSyncUpdated, cancelAsync.sync).catch((error) => {
      if (error instanceof AbortedError) return;
      this.setState({ error });
    });
    preloadSync.rendered();
  }

  handleBeginPreload(didAnnounce) {
    const { promise: promiseFn, onPreload } = this.props;
    promiseFn?.(this.promise);
    if (!didAnnounce) onPreload?.();
  }

  handleEndPreload(didAnnounce, success) {
    if (this.preloadedFuture) {
      this.preloadedFuture.resolve(success);
      this.preloadedFuture = null;
      this.props.promise?.(null);
    }

    if (!didAnnounce && success) this.props.onLoad?.();
  }

  handlePreloadError(error) {
    const { onError } = this.props;

    // If an `onError` is defined, the error was already announced.
    let didAnnounce = Boolean(onError);

    if (this.preloadedFuture) {
      this.preloadedFuture.reject(error);
      this.preloadedFuture = null;
      this.props.promise?.(null);
      didAnnounce = true;
    }
    
    if (!didAnnounce) throw error;
  }

  componentDidMount() {
    this.attachToPreloadSync();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      preloadSync,
      props: { promise: promiseFn, onPreload, onLoad, onError, once },
      state: { error, preloadState }
    } = this;

    if (promiseFn !== prevProps.promise) {
      prevProps.promise?.(null);
      promiseFn?.(this.promise);
    }

    if (error) {
      if (onError !== prevProps.onError)
        onError?.(error, true);
      if (error !== prevState.error)
        this.handlePreloadError(error);
      return;
    }

    let didOnPreload = false;
    let didOnLoad = false;

    if (onPreload !== prevProps.onPreload && preloadState !== $$preloaded) {
      onPreload?.();
      didOnPreload = true;
    }

    if (onLoad !== prevProps.onLoad && preloadState === $$preloaded) {
      onLoad?.();
      didOnLoad = true;
    }
    
    if (preloadState !== prevState.preloadState) {
      if (preloadState === $$preloading) this.handleBeginPreload(didOnPreload);
      else if (preloadState === $$preloaded) this.handleEndPreload(didOnLoad, true);
    }

    if (once !== prevProps.once && !once)
      if (preloadSync.state !== preloadState)
        this.preloadSyncUpdated(preloadSync.state);
  }

  componentWillUnmount() {
    const { preloadSync, state: { preloadState } } = this;
    if (preloadState !== $$preloaded)
      this.handleEndPreload(false, false);
    preloadSync.done();
    this.cancelAsync.resolve();
  }

  render() {
    const {
      display, preloadSync,
      props: { children, id, style: customStyle, className },
      state: { mustRender, error, preloadState }
    } = this;

    if (!mustRender || error)
      return null;
    
    if (display === $naked) {
      return (
        <PreloadContext.Provider value={preloadSync}>
          {children}
        </PreloadContext.Provider>
      );
    }

    const hide = dew(() => {
      switch (display) {
        case $always: return false;
        case $never: return true;
        default: return preloadState !== $$preloaded;
      }
    });

    const style = Object.assign({}, customStyle, hide ? { display: "none" } : null);

    return (
      <PreloadContext.Provider value={preloadSync}>
        <div id={id} className={className} style={style}>{children}</div>
      </PreloadContext.Provider>
    );
  }

}

export default Preloader;