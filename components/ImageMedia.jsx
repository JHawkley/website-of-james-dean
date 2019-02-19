import PropTypes from "prop-types";
import { is, Composition } from "tools/common";
import { preloadImage } from "tools/async";
import { memoize } from "tools/functions";
import { extensions as propTypeEx, hasOwn as propTypeHasOwn } from "tools/propTypes";
import Preloadable from "components/Preloadable";
import ImagePreloadError from "components/ImageMedia/ImagePreloadError";
import { fluidCss, resolveMarginCss } from "styles/jsx/components/ImageMedia";

class ImageMedia extends Preloadable {

  static propTypes = {
    src: PropTypes.string::propTypeEx.notEmpty().isRequired,
    className: PropTypes.string,
    width: PropTypes.number::propTypeEx.dependsOn("height"),
    height: PropTypes.number::propTypeEx.dependsOn("width"),
    fluid: PropTypes.bool::propTypeEx.dependsOn(["width", "height"]),
    imgRef: PropTypes.oneOfType([
      PropTypes.func, 
      PropTypes.shape({ current: propTypeHasOwn })
    ])
  };

  static defaultProps = {
    fluid: false
  };

  imgIsComplete = false;

  checkComplete = (img) => {
    // Forward the img-ref.
    const { imgRef } = this.props;
    if (imgRef) {
      if (imgRef::is.func()) imgRef(img);
      else imgRef.current = img;
    }
    // Do our logic.
    this.imgIsComplete = Boolean(img?.complete);
    if (this.imgIsComplete) this.handlePreloaded();
  }

  onLoad = this.handlePreloaded;

  onError = () => {
    const { src } = this.props;
    const msg = ["image failed to load", src].filter(Boolean).join(": ");
    this.handlePreloadError(new ImagePreloadError(msg));
  }

  memoizedMarginCss = memoize(resolveMarginCss);

  componentDidMount() {
    super.componentDidMount();
    const { src } = this.props;
    if (!src) this.handlePreloaded();
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);
    const { src } = this.props;
    if (src !== prevProps.src) {
      if (!this.imgIsComplete) this.handleResetPreload();
      if (!src) this.handlePreloaded();
    }
  }

  renderImage(className, src, width, height, imgProps) {
    return (
      <img
        {...imgProps}
        ref={this.checkComplete}
        width={width} height={height}
        src={src}
        className={className}
        onLoad={this.onLoad}
        onError={this.onError}
      />
    );
  }

  renderFluid(customClass, src, width, height, imgProps) {
    const marginCss = this.memoizedMarginCss(width, height);
    const containerClass = [marginCss.className, fluidCss.className].join(" ");

    const imgElement = this.renderImage(customClass, src, width, height, imgProps);

    return (
      <div className={containerClass}>
        {imgElement}
        {fluidCss.styles}
        {marginCss.styles}
      </div>
    );
  }

  render() {
    const {
      className, src, width, height, fluid,
      ...imgProps
    } = this.props;

    if (!src) return null;
    if (fluid) return this.renderFluid(className, src, width, height, imgProps);
    return this.renderImage(className, src, width, height, imgProps);
  }

}

function importWrapper(src, width, height, type) {
  const ImportedImage = (props) => {
    return <ImageMedia {...props} src={src} width={width} height={height} />;
  };

  const composition = new Composition({ src, width, height });
  if (type) composition.compose({ type });

  return Object.assign(
    ImportedImage,
    {
      displayName: `importedImage("${src}")`,
      preload: () => preloadImage(src, { width, height })
    },
    composition.result
  );
}

export default ImageMedia;
export { importWrapper };