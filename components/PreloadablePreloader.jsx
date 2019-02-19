import Preloader from "components/Preloader";
import Preloadable from "components/Preloadable";

class PreloadablePreloader extends Preloadable {

  static propTypes = Preloader.propTypes;

  handlePreload = () => {
    this.props.onPreload?.();
    if (this.state.preloaded)
      this.handleResetPreload();
  }

  handleLoad = (complete) => {
    this.props.onLoad?.(complete);
    this.handlePreloaded();
  }

  handleError = (error, final) => {
    if (this.props.onError?.(error, final) === true && !final) return true;
    this.handlePreloadError(error);
    return false;
  }

  componentDidUpdate(prevProps) {
    super.componentDidUpdate(...arguments);

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

  render() {
    const {
      handlePreload, handleLoad, handleError,
      props: {
        // eslint-disable-next-line no-unused-vars
        onPreload, onLoad, onError,
        ...preloaderProps
       }
    } = this;

    return (
      <Preloader
        {...preloaderProps}
        onPreload={handlePreload}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }
  
}

export default PreloadablePreloader;