import React from "react";
import { is } from "tools/common";
import PropTypes, { extensions as propTypeEx } from "tools/propTypes";
import { memoize } from "tools/functions";
import Preloadable from "components/Preloadable";
import Audio from "components/Audio";
import SoundPreloadError from "components/SoundMedia/SoundPreloadError";

class SoundMedia extends React.PureComponent {

  static propTypes = {
    src: PropTypes.string::propTypeEx.notEmpty().isRequired,
    audioRef: PropTypes.oneOfType([
      PropTypes.func, 
      PropTypes.shape({ current: PropTypes.hasOwn })
    ])
  };

  state = {
    preloaded: !this.props.src,
    error: null
  };

  didUnmount = false;

  audioEl = null;

  decomposeProps = memoize((ownProps) => {
    const {
        src,
        audioRef, // eslint-disable-line no-unused-vars
        ...audioProps
     } = ownProps;

    return { src, audioProps };
  });

  checkReadiness = (audioEl) => {
    const { props: { audioRef }, state: { preloaded } } = this;
    this.audioEl = audioEl;

    // Forward the audio-ref.
    if (audioRef) {
      if (audioRef::is.func()) audioRef(audioEl);
      else audioRef.current = audioEl;
    }

    // Do our logic.
    const audioIsReady = audioEl?.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA;

    if (audioIsReady === preloaded) return;
    else if (audioIsReady) this.setState({ preloaded: true });
    else this.setState({ preloaded: false, error: null });
  }

  onCanPlayThrough = () => {
    if (this.didUnmount) return;
    this.setState({ preloaded: true });
  };

  onError = () => {
    if (this.didUnmount) return;
    const src = this.props.src;
    const msg = ["sound failed to load", src].filter(Boolean).join(": ");
    this.setState({ preloaded: true, error: new SoundPreloadError(msg) });
  }

  componentDidUpdate(prevProps) {
    const { src } = this.props;
    if (src !== prevProps.src)
      this.setState({ preloaded: false, error: null }, () => this.audioEl?.load());
  }

  componentWillUnmount() {
    this.didUnmount = true;
  }

  render() {
    const {
      checkReadiness, onCanPlayThrough, onError,
      state: { preloaded, error }
    } = this;
    const { src, audioProps } = this.decomposeProps(this.props);

    if (!src) return null;

    return (
      <Preloadable preloaded={preloaded} error={error}>
        <audio
          {...audioProps}
          ref={checkReadiness}
          src={src}
          onCanPlayThrough={onCanPlayThrough}
          onError={onError}
        />
      </Preloadable>
    );
  }

}

function importWrapper(src, type) {
  const source = <source src={src} type={type} />;

  const ImportedSound = ({asSource, ...props}) => {
    if (asSource) return source;
    if (type) return <Audio {...props}>{source}</Audio>;
    return <SoundMedia {...props} src={src} />;
  };

  ImportedSound.propTypes = { asSource: PropTypes.bool };
  ImportedSound.displayName = `importedSound("${src}")`;
  ImportedSound.isImportedSound = true;

  return ImportedSound;
}

export default SoundMedia;
export { importWrapper };