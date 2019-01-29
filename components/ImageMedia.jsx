import PropTypes from "prop-types";
import { is, Composition } from "tools/common";
import { preloadImage } from "tools/async";
import { extensions as propTypeEx, hasOwn as propTypeHasOwn } from "tools/propTypes";
import Preloadable from "components/Preloadable";
import PreloadSync from "components/associates/PreloadSync";

class ImageMedia extends Preloadable {

  static propTypes = {
    ...Preloadable.propTypes,
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
    const { mainSrc } = this.state;
    const msg = ["image failed to load"];
    if (mainSrc) msg.push(mainSrc);
    this.handlePreloadError(new Error(msg.join(": ")));
  }

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

  render() {
    const {
      checkComplete, onLoad, onError,
      props: {
        className: customClass,
        src, width, height, fluid,
        preloadSync, // eslint-disable-line no-unused-vars
        ...imgProps
      }
    } = this;

    if (!src) return null;

    const classNameBuilder = [];
    if (customClass) classNameBuilder.push(customClass);
    if (fluid) classNameBuilder.push("fluid");
    const className = classNameBuilder.length > 0 ? classNameBuilder.join(" ") : null;

    const imgElement = (
      <img
        {...imgProps}
        ref={checkComplete}
        width={width} height={height}
        src={src} className={className}
        onLoad={onLoad} onError={onError}
      />
    );

    if (!fluid) return imgElement;

    return (
      <div className="fluid-container">
        {imgElement}
        <style jsx>
          {`
            .fluid-container {
              display: block !important;
              position: relative !important;
              max-width: 100% !important;
            }
            .fluid {
              position: absolute !important;
              top: 0px !important;
              left: 0px !important;
              width: 100% !important;
              height: 100% !important;
              max-width: inherit !important;
            }
          `}
        </style>
        <style jsx>
          {`
            .fluid-container {
              width: ${width}px;
              paddingBottom: ${100.0 / (width / height)}%;
            }
          `}
        </style>
      </div>
    );
  }

}

function importWrapper(src, width, height, type) {
  const ImportedImage = (props) => {
    return <ImageMedia {...props} src={src} width={width} height={height} />;
  };

  const composition = new Composition({ src, width, height });
  if (type) composition.compose({ type });

  return Object.assign(
    Preloadable.mark(ImportedImage),
    {
      propTypes: { preloadSync: PropTypes.instanceOf(PreloadSync) },
      displayName: `importedImage("${src}")`,
      preload: () => preloadImage(src, width, height)
    },
    composition.result
  );
}

export default ImageMedia;
export { importWrapper };