import { is, Composition } from "tools/common";
import PropTypes, { extensions as propTypeEx } from "tools/propTypes";
import Preloadable from "components/Preloadable";
import Audio from "components/Audio";
import SoundPreloadError from "components/SoundMedia/SoundPreloadError";

class SoundMedia extends Preloadable {

  static propTypes = {
    src: PropTypes.string::propTypeEx.notEmpty().isRequired,
    audioRef: PropTypes.oneOfType([
      PropTypes.func, 
      PropTypes.shape({ current: PropTypes.hasOwn })
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
    const msg = ["sound failed to load", src].filter(Boolean).join(": ");
    this.handlePreloadError(new SoundPreloadError(msg));
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
        audioRef, // eslint-disable-line no-unused-vars
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

  ImportedSound.propTypes = { asSource: PropTypes.bool };

  ImportedSound.displayName = `importedSound("${src}")`;

  return Object.assign(Audio.markSourceable(ImportedSound), soundData);
}

export default SoundMedia;
export { importWrapper };