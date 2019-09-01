import React from "react";
import Preloader from "components/Preloader";
import Preloadable from "components/Preloadable";
import { memoize } from "tools/functions";

/**
 * A `Preloadable` that has its own `PreloadSync` context, isolating its
 * descendants from an ancestor preload context.  This type of preloadable
 * will only enter a "loaded" state once all `Preloadable` descendants are
 * also in a "loaded" state.
 *
 * @class PreloadablePreloader
 * @extends {React.PureComponent}
 */
class PreloadablePreloader extends React.PureComponent {

  static propTypes = Preloader.propTypes;

  state = {
    preloaded: false,
    error: null
  };

  didUnmount = false;

  getPreloaderProps = memoize((ownProps) => {
    const {
      // eslint-disable-next-line no-unused-vars
      onPreload, onLoad, onError,
      ...preloaderProps
     } = ownProps;

    return preloaderProps;
  });

  handlePreload = () => {
    this.props.onPreload?.();
    if (!this.didUnmount)
      if (this.state.preloaded)
        this.setState({ preloaded: false, error: null });
  }

  handleLoad = (complete) => {
    this.props.onLoad?.(complete);
    if (!this.didUnmount)
      this.setState({ preloaded: true });
  }

  handleError = (error, final) => {
    if (this.props.onError?.(error, final) === true && !final) return true;
    if (!this.didUnmount)
      this.setState({ preloaded: true, error });
    return false;
  }

  componentDidUpdate(prevProps) {
    const {
      props: { onPreload, onLoad, onError },
      state: { error, preloaded }
    } = this;

    if (onPreload !== prevProps.onPreload && !preloaded && !error)
      onPreload?.();

    if (onLoad !== prevProps.onLoad && preloaded && !error)
      onLoad?.(true);

    if (onError !== prevProps.onError && error)
      onError?.(error, true);
  }

  componentWillUnmount() {
    this.didUnmount = true;
  }

  render() {
    const {
      handlePreload, handleLoad, handleError,
      state: { preloaded, error }
    } = this;
    const preloaderProps = this.getPreloaderProps(this.props);

    return (
      <Preloadable preloaded={preloaded} error={error}>
        <Preloader
          {...preloaderProps}
          onPreload={handlePreload}
          onLoad={handleLoad}
          onError={handleError}
        />
      </Preloadable>
    );
  }
  
}

export default PreloadablePreloader;