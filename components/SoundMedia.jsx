import PropTypes from "prop-types";
import { is, Composition } from "tools/common";
import { extensions as arrEx } from "tools/array";
import { extensions as propTypeEx } from "tools/propTypes";
import { Preloadable, PreloadSync } from "components/Preloader";

const soundPropType = PropTypes.oneOfType([
  PropTypes.string::propTypeEx.notEmpty(),
  PropTypes.shape({
    src: PropTypes.string::propTypeEx.notEmpty().isRequired,
    type: PropTypes.string::propTypeEx.notEmpty(),
    codec: PropTypes.string::propTypeEx.notEmpty()::propTypeEx.dependsOn("type")
  })
]);

class SoundMedia extends Preloadable {

  static propTypes = {
    ...Preloadable.propTypes,
    src: PropTypes.oneOfType([
      soundPropType,
      PropTypes.arrayOf(soundPropType)::propTypeEx.notEmpty()
    ]).isRequired
  };

  static getDerivedStateFromProps(props) {
    return { renderProps: getRenderProps(props.src) };
  }

  audioIsReady = false;

  checkReadiness = (audio) => {
    if (!audio) return;
    this.audioIsReady = audio.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA;
    if (this.audioIsReady) this.handlePreloaded();
  }

  onCanPlayThrough = this.handlePreloaded;

  onError = () => {
    const src = getSrc(this.props.src);
    const msg = ["sound failed to load"];
    if (src) msg.push(src);
    this.handlePreloadError(new Error(msg.join(": ")));
  }

  componentDidMount() {
    super.componentDidMount();
    const { renderProps } = this.state;
    if (!renderProps) this.handlePreloaded();
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);
    const { props: { src }, state: { renderProps } } = this;
    if (src !== prevProps.src && !this.audioIsReady)
      this.handleResetPreload();
    if (renderProps !== prevState.renderProps && !renderProps)
      this.handlePreloaded();
  }

  render() {
    const {
      checkReadiness, onCanPlayThrough, onError,
      props: {
        src, preloadSync, // eslint-disable-line no-unused-vars
        ...audioProps
      },
      state: { renderProps }
    } = this;

    if (!renderProps) return null;

    return (
      <audio
        {...audioProps}
        {...renderProps}
        ref={checkReadiness}
        onCanPlayThrough={onCanPlayThrough}
        onError={onError}
      />
    );
  }

}

function importWrapper(src, type, codec) {
  const ImportedSound = (props) => {
    if (!type) return <SoundMedia {...props} src={src} />;
    return <SoundMedia {...props} src={{ src, type, codec }} />;
  };

  const composition = new Composition({ src });
  if (type && codec) composition.compose({ type, codec });
  else if (type) composition.compose({ type });

  return Object.assign(
    Preloadable.mark(ImportedSound),
    {
      propTypes: { preloadSync: PropTypes.instanceOf(PreloadSync) },
      displayName: `importedSound("${src}")`
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

const getRenderProps = (obj) => {
  if (!obj)
    return null;

  if (obj::is.string())
    return { src: obj };

  if (obj::is.array()) {
    const sourceElements = obj::arrEx.collect(processSource);
    if (sourceElements.length === 0) return null;
    return { children: sourceElements };
  }

  const sourceElement = processSource(obj);
  if (sourceElement)
    return { children: [sourceElement] };

  return null;
};

const processSource = (givenSrc) => {
  if (!givenSrc) return void 0;

  if (givenSrc::is.string())
    return <source key={givenSrc} src={givenSrc} />;

  const { src, type: baseType, codec } = givenSrc;
  if (!src) return void 0;
  const type = baseType ? (codec ? `${baseType}; codecs=${codec}` : baseType) : null;
  return <source key={src} src={src} type={type} />;
};

export default SoundMedia;
export { importWrapper };