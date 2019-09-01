import React from "react";
import PropTypes from "prop-types";
import PreloadContext from "lib/PreloadContext";
import PreloadSync from "components/Preloader/PreloadSync";
import { is } from "tools/common";
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

/**
 * Creates and provides feedback for a preload context.  Any descendant
 * `Preloadable` components will mount the `PreloadSync` exposed by this
 * component to announce changes to their loading state.
 *
 * @class Preloader
 * @extends {React.PureComponent}
 */
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

  attachToPreloadSync = () => {
    const { preloadSync, preloadSyncUpdated, cancelAsync } = this;
    preloadSync.updates::asyncIterEx.forEach(preloadSyncUpdated, cancelAsync.sync).catch((error) => {
      if (error instanceof AbortedError) return;
      this.setState({ error });
    });
    preloadSync.rendered();
  }

  announceBeginPreload() {
    const { promise: promiseFn, onPreload } = this.props;

    promiseFn?.(this.promise);
    onPreload?.();
  }

  announceEndPreload(success) {
    const { onLoad } = this.props;

    if (this.preloadedFuture) {
      this.preloadedFuture.resolve(success);
      this.preloadedFuture = null;
      this.props.promise?.(null);
    }

    if (success) onLoad?.();
  }

  tryAnnounceError(error, forceOnError) {
    const { onError } = this.props;
    const errorForced = forceOnError && onError;
    const didAnnounce = errorForced || this.preloadedFuture;

    if (this.preloadedFuture) {
      this.preloadedFuture.reject(error);
      this.preloadedFuture = null;
      this.props.promise?.(null);
    }

    if (errorForced) onError(error, true);
    
    return Boolean(didAnnounce);
  }

  tryAnnounceUpdate(prevState, curState) {
    if (prevState === curState)
      return false;

    if (curState === $$fresh)
      return false;

    const skippedPreloading = prevState === $$fresh && curState === $$preloaded;

    if (curState === $$preloading || skippedPreloading)
      this.announceBeginPreload();

    if (curState === $$preloaded)
      this.announceEndPreload(true);

    return true;
  }

  componentDidMount() {
    if (this.state.mustRender)
      this.attachToPreloadSync();
  }

  componentDidUpdate(prevProps, prevState) {
    const { props: { promise: promiseFn }, state: { error } } = this;

    if (promiseFn !== prevProps.promise) {
      prevProps.promise?.(null);
      promiseFn?.(this.promise);
    }

    if (!error) this.componentDidUpdateNormally(prevProps, prevState);
    else this.componentDidUpdateWithError(prevProps, prevState);
  }

  componentDidUpdateNormally(prevProps, prevState) {
    const {
      preloadSync,
      props: { wait, once },
      state: { preloadState, mustRender }
    } = this;
    const didAnnounce = this.tryAnnounceUpdate(prevState.preloadState, preloadState);

    if (!didAnnounce) {
      const { onLoad, onPreload } = this.props;

      if (onLoad !== prevProps.onLoad)
        preloadState === $$preloaded && onLoad?.();
      else if (onPreload !== prevProps.onPreload)
        preloadState === $$preloading && onPreload?.();
    }

    if (!wait && !mustRender)
      this.setState({ mustRender: true }, this.attachToPreloadSync);

    if (once !== prevProps.once && !once)
      if (preloadSync.state !== preloadState)
        this.preloadSyncUpdated(preloadSync.state);
  }

  componentDidUpdateWithError(prevProps, prevState) {
    const { props: { onError }, state: { error } } = this;

    const onErrorUpdated = onError !== prevProps.onError;
    const needAnnounce = error !== prevState.error || onErrorUpdated;

    if (needAnnounce) {
      const didAnnounce = this.tryAnnounceError(error, onErrorUpdated);
      if (!didAnnounce) throw error;
    }
  }

  componentWillUnmount() {
    const { preloadSync, state: { error, preloadState } } = this;

    if (!error && preloadState !== $$preloaded)
      this.announceEndPreload(false);
    
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

    const hide
      = display === $always ? false
      : display === $never ? true
      : preloadState !== $$preloaded;
    
    const style = hide ? { ...customStyle, display: "none" } : customStyle;

    return (
      <PreloadContext.Provider value={preloadSync}>
        <div id={id} className={className} style={style}>{children}</div>
      </PreloadContext.Provider>
    );
  }

}

export default Preloader;