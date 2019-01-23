import PropTypes from "prop-types";
import { is, Composition } from "tools/common";
import { extensions as arrEx } from "tools/array";
import { preloadImage } from "tools/async";
import { extensions as propTypeEx } from "tools/propTypes";
import { Preloadable, PreloadSync } from "components/Preloader";

const imagePropType = PropTypes.oneOfType([
  PropTypes.string::propTypeEx.notEmpty(),
  PropTypes.shape({
    src: PropTypes.string::propTypeEx.notEmpty().isRequired,
    type: PropTypes.string::propTypeEx.notEmpty()
  })
]);

class ImageMedia extends Preloadable {

  static propTypes = {
    ...Preloadable.propTypes,
    src: PropTypes.oneOfType([
      imagePropType,
      PropTypes.arrayOf(imagePropType)::propTypeEx.notEmpty()
    ]).isRequired,
    className: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    fluid: PropTypes.bool::propTypeEx.dependsOn("width", "height")
  };

  static defaultProps = {
    fluid: false
  };

  static getDerivedStateFromProps(props) {
    const { src } = props;
    const mainSrc = getSrc(src);
    if (!mainSrc) return { mainSrc: null, sourceElements: null };
    if (!src::is.array()) return { mainSrc, sourceElements: null };

    const sourceElements = src::arrEx.collect(processSource);
    if (sourceElements.length === 0) return { mainSrc: null, sourceElements: null };
    return { mainSrc, sourceElements };
  }

  imgIsComplete = false;

  checkComplete = (img) => {
    if (!img) return;
    this.imgIsComplete = img.complete;
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
    const { mainSrc } = this.state;
    if (!mainSrc) this.handlePreloaded();
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);
    const { props: { src }, state: { mainSrc } } = this;
    if (src !== prevProps.src && !this.imgIsComplete)
      this.handleResetPreload();
    if (mainSrc !== prevState.mainSrc && !mainSrc)
      this.handlePreloaded();
  }

  render() {
    const {
      checkComplete, onLoad, onError,
      props: {
        className: customClass,
        width, height, fluid,
        src, preloadSync, // eslint-disable-line no-unused-vars
        ...imgProps
      },
      state: { mainSrc, sourceElements }
    } = this;

    if (!mainSrc) return null;

    const classNameBuilder = [];
    if (customClass) classNameBuilder.push(customClass);
    if (fluid) classNameBuilder.push("fluid");
    const className = classNameBuilder.length > 0 ? classNameBuilder.join(" ") : null;

    const imgElement = (
      <img
        {...imgProps}
        ref={checkComplete}
        width={width} height={height}
        src={mainSrc} className={className}
        onLoad={onLoad} onError={onError}
      />
    );

    const renderedElement
      = sourceElements::is.array()
      ? <picture>{sourceElements}{imgElement}</picture>
      : imgElement;

    if (!fluid) return renderedElement;

    return (
      <div className="fluid-container">
        {renderedElement}
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

const getSrc = (obj) => {
  if (!obj) return void 0;
  if (obj::is.string()) return obj;
  if (obj::is.array()) return obj::arrEx.collectFirst(getSrc);
  if (obj.src::is.string()) return obj.src;
  return void 0;
};

const processSource = (givenSrc) => {
  if (!givenSrc) return void 0;

  if (givenSrc::is.string())
    return <source key={givenSrc} srcSet={givenSrc} />;

  const { src, type } = givenSrc;
  if (!src) return void 0;
  return <source key={src} srcSet={src} type={type} />;
};

export default ImageMedia;
export { importWrapper };