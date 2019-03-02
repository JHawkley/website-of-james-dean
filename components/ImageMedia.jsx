import React from "react";
import { is, Composition } from "tools/common";
import { preloadImage } from "tools/async";
import { memoize } from "tools/functions";
import PropTypes, { extensions as propTypeEx } from "tools/propTypes";
import Preloadable from "components/Preloadable";
import ImagePreloadError from "components/ImageMedia/ImagePreloadError";
import { fluidCss, resolveMarginCss } from "styles/jsx/components/ImageMedia";

class ImageMedia extends React.PureComponent {

  static propTypes = {
    src: PropTypes.string::propTypeEx.notEmpty().isRequired,
    className: PropTypes.string,
    width: PropTypes.number::propTypeEx.dependsOn("height"),
    height: PropTypes.number::propTypeEx.dependsOn("width"),
    fluid: PropTypes.bool::propTypeEx.dependsOn(["width", "height"]),
    imgRef: PropTypes.oneOfType([
      PropTypes.func, 
      PropTypes.shape({ current: PropTypes.hasOwn })
    ])
  };

  state = {
    preloaded: !this.props.src,
    error: null
  };

  didUnmount = false;

  decomposeProps = memoize((ownProps) => {
    const {
      className, src, width, height, fluid,
      ...imgProps
     } = ownProps;

    return { className, src, width, height, fluid, imgProps };
  });

  checkComplete = (img) => {
    const { props: { imgRef }, state: { preloaded } } = this;

    // Forward the img-ref.
    if (imgRef) {
      if (imgRef::is.func()) imgRef(img);
      else imgRef.current = img;
    }

    // Do our logic.
    const imgIsComplete = Boolean(img?.complete);

    if (imgIsComplete === preloaded) return;
    else if (imgIsComplete) this.setState({ preloaded: true });
    else this.setState({ preloaded: false, error: null });
  }

  onLoad = () => {
    if (this.didUnmount) return;
    this.setState({ preloaded: true });
  }

  onError = () => {
    const { src } = this.props;
    const msg = ["image failed to load", src].filter(Boolean).join(": ");
    this.setState({ preloaded: true, error: new ImagePreloadError(msg) });
  }

  memoizedMarginCss = memoize(resolveMarginCss);

  componentWillUnmount() {
    this.didUnmount = true;
  }

  renderImage(className, src, width, height, imgProps) {
    const { preloaded, error } = this.state;

    return (
      <Preloadable preloaded={preloaded} error={error}>
        <img
          {...imgProps}
          key={src}
          ref={this.checkComplete}
          width={width} height={height}
          src={src}
          className={className}
          onLoad={this.onLoad}
          onError={this.onError}
        />
      </Preloadable>
    );
  }

  renderFluid(customClass, src, width, height, imgProps) {
    const marginCss = this.memoizedMarginCss(width, height);
    const containerClass = `${marginCss.className} ${fluidCss.className}`;
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
    const { className, src, width, height, fluid, imgProps } = this.decomposeProps(this.props);

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