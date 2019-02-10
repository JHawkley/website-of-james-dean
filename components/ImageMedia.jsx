import PropTypes from "prop-types";
import { is, Composition } from "tools/common";
import { preloadImage } from "tools/async";
import { extensions as propTypeEx, hasOwn as propTypeHasOwn } from "tools/propTypes";
import Preloadable from "components/Preloadable";
import { fluidCss, fluidMargin } from "styles/jsx/imageMedia";

class ImageMedia extends Preloadable {

  static propTypes = {
    src: PropTypes.string::propTypeEx.notEmpty().isRequired,
    className: PropTypes.string,
    width: PropTypes.number::propTypeEx.dependsOn("height"),
    height: PropTypes.number::propTypeEx.dependsOn("width"),
    fluid: PropTypes.bool::propTypeEx.dependsOn(["width", "height"]),
    important: PropTypes.bool,
    imgRef: PropTypes.oneOfType([
      PropTypes.func, 
      PropTypes.shape({ current: propTypeHasOwn })
    ])
  };

  static defaultProps = {
    fluid: false,
    important: false
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
    if (this.props.important) {
      const { src } = this.state;
      const msg = ["image failed to load"];
      if (src) msg.push(src);
      this.handlePreloadError(new Error(msg.join(": ")));
    }
    else {
      this.handlePreloaded();
    }
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
        important, // eslint-disable-line no-unused-vars
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

    const marginCss = fluidMargin(this.props);

    return (
      <div className={`fluid-container ${marginCss.className}`}>
        {imgElement}
        <style jsx>{fluidCss}</style>
        {marginCss.styles}
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