import PropTypes from "prop-types";
import { is, Composition } from "tools/common";
import { extensions as propTypeEx, hasOwn as propTypeHasOwn } from "tools/propTypes";
import Preloadable from "components/Preloadable";
import Audio from "components/Audio";

class SoundMedia extends Preloadable {

  static propTypes = {
    ...Preloadable.propTypes,
    src: PropTypes.string::propTypeEx.notEmpty().isRequired,
    audioRef: PropTypes.oneOfType([
      PropTypes.func, 
      PropTypes.shape({ current: propTypeHasOwn })
    ])
  };

  audioIsReady = false;

  checkReadiness = (audio) => {
    // Forward the audio-ref.
    const { audioRef } = this.props;
    if (audioRef) {
      if (audioRef::is.func()) audioRef(audio);
      else audioRef.current = audio;
    }
    // Do our logic.
    this.audioIsReady = audio ? audio.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA : false;
    if (this.audioIsReady) this.handlePreloaded();
  }

  onCanPlayThrough = this.handlePreloaded;

  onError = () => {
    const src = this.props.src;
    const msg = ["sound failed to load"];
    if (src) msg.push(src);
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
      if (!this.audioIsReady) this.handleResetPreload();
      if (!src) this.handlePreloaded();
    }
  }

  render() {
    const {
      checkReadiness, onCanPlayThrough, onError,
      props: {
        src,
        audioRef, preloadSync, // eslint-disable-line no-unused-vars
        ...audioProps
      }
    } = this;

    if (!src) return null;

    return (
      <audio
        {...audioProps}
        src={src}
        ref={checkReadiness}
        onCanPlayThrough={onCanPlayThrough}
        onError={onError}
      />
    );
  }

}

function importWrapper(src, type, codec) {
  const composition = new Composition({ src });
  if (type && codec) composition.compose({ type, codec });
  else if (type) composition.compose({ type });

  const soundData = composition.result;

  const ImportedSound = ({asSource, ...props}) => {
    if (asSource) return Audio.sourceFromObj(soundData);
    if (!type) return <SoundMedia {...props} src={src} />;
    return <Audio {...props}>{Audio.sourceFromObj(soundData)}</Audio>;
  };

  return Object.assign(
    Audio.markSourceable(Preloadable.mark(ImportedSound)),
    {
      propTypes: {
        ...Preloadable.propTypes,
        asSource: PropTypes.bool
      },
      displayName: `importedSound("${src}")`
    },
    soundData
  );
}

export default SoundMedia;
export { importWrapper };