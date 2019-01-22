import PropTypes from "prop-types";
import { is } from "tools/common";
import { preloadImage } from "tools/async";
import { extensions as propTypeEx } from "tools/propTypes";
import { Preloadable, symbol as $$preloadable } from "components/Preloader";

const $$sourceable = Symbol("image-media:sourceable");

const isSourceable = (fn) => {
  if (fn[$$sourceable] === true) return true;
  const name = fn.displayName ?? fn.name;
  if (name) return `the component \`${name}\` was not sourceable`;
  return `the provided function was not a sourceable component`;
}

const arrayNotEmpty = (arr) => arr.length > 0 || "array may not be empty";
const stringNotEmpty = (str) => str === "" || "string may not be empty";

class ImageMedia extends Preloadable {

  static propTypes = {
    ...Preloadable.propTypes,
    src: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.string::propTypeEx.predicate(stringNotEmpty),
          PropTypes.func::propTypeEx.predicate(isSourceable),
          PropTypes.shape({
            src: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired
          })
        ])
      )::propTypeEx.predicate(arrayNotEmpty)
    ]).isRequired,
    className: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    fluid: PropTypes.bool::propTypeEx.dependsOn("width", "height")
  };

  static defaultProps = {
    fluid: false
  };

  componentDidMount() {
    super.componentDidMount();
    const { src } = this.props;
    if (src::is.array() && src.length === 0)
      this.handlePreloaded();
  }

  render() {
    const {
      handlePreloaded: onLoad, handlePreloadError: onError,
      props: { src: srcSet, className: customClass, width, height, fluid, ...imgProps }
    } = this;
    const haveArray = srcSet::is.array();

    if (haveArray && srcSet.length === 0) return null;

    const src = haveArray ? srcSet[0].src : srcSet;
    const classNameBuilder = [];
    if (customClass) classNameBuilder.push(customClass);
    if (fluid) classNameBuilder.push("fluid");
    const className = classNameBuilder.length > 0 ? classNameBuilder.join(" ") : null;

    let element = (
      <img
        { ...imgProps }
        width={width} height={height}
        src={src} className={className}
        onLoad={onLoad} onError={onError}
      />
    );

    element = haveArray ? makePicture(element, srcSet) : element;

    if (!fluid) return element;

    return (
      <div className="fluid-container">
        { element }
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
  const ImportedImage = ({asSource, ...props}) => {
    if (asSource) return <source srcSet={src} type={type} />;
    return <ImageMedia {...props} src={src} width={width} height={height} />;
  };

  return Object.assign(
    ImportedImage,
    {
      propTypes: { asSource: PropTypes.bool, ...Preloadable.propTypes },
      displayName: `importedImage("${src}")`,
      preload: () => preloadImage(src, width, height),
      [$$preloadable]: true
    },
    type == null ? { src, width, height } : { src, width, height, type }
  );
}

const processSource = (givenSrc) => {
  if (givenSrc::is.string())
    return <source key={givenSrc} srcSet={givenSrc} />;
  
  if (givenSrc::is.func()) {
    const Component = givenSrc;
    return <Component key={givenSrc.src} asSource />;
  }

  return <source key={givenSrc.src} srcSet={givenSrc.src} type={givenSrc.type} />;
};

const makePicture = (imgEl, srcSet) =>
  <picture>{ srcSet.map(processSource) }{ imgEl }</picture>;

export default ImageMedia;
export { importWrapper };