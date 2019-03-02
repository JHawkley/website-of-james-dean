import React from "react";
import SoundPreloadError from "components/SoundMedia/SoundPreloadError";
import { is, compareOwnProps } from "tools/common";
import { memoize } from "tools/functions";
import PropTypes, { extensions as propTypeEx } from "tools/propTypes";
import { compareFlatChildren } from "tools/react";
import Preloadable from "components/Preloadable";
import SoundMedia from "components/SoundMedia";

class Audio extends React.Component {

  static propTypes = {
    children: PropTypes.flatChildren([
        PropTypes.shape({
          type: PropTypes.exactly("source").isRequired,
          props: PropTypes.shape({
            src: PropTypes.string::propTypeEx.notEmpty().isRequired,
            type: PropTypes.string
          })
        }),
        PropTypes.shape({
          type: PropTypes.anyShape({ isImportedSound: PropTypes.exactly(true).isRequired }),
          props: PropTypes.shape({ asSource: PropTypes.exactly(true).isRequired })
        })
      ])::propTypeEx.exclusiveTo("src", true),
    src:
      PropTypes.string
      ::propTypeEx.notEmpty().isRequired
      ::propTypeEx.exclusiveTo("children"),
    audioRef: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({ current: PropTypes.hasOwn })
    ])
  };

  state = {
    preloaded: false,
    error: null
  };

  audioEl = null;

  sourcesChanged = false;

  didUnmount = false;

  decomposeProps = memoize((ownProps) => {
    const { children, src, audioRef, ...audioProps } = ownProps;
    return { children, src, audioRef, audioProps };
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
    const src = getFirstSrc(this.props.children);
    const msg = ["sound failed to load", src].filter(Boolean).join(": ");
    this.setState({ preloaded: true, error: new SoundPreloadError(msg) });
  }

  childrenDiffer() {
    this.sourcesChanged = true;
    return true;
  }

  shouldComponentUpdate({children: nextChildren, ...nextProps}, nextState) {
    const { children, ...props } = this.props;
    if (!compareFlatChildren(children, nextChildren)) return this.childrenDiffer();
    if (!compareOwnProps(props, nextProps)) return true;
    if (!compareOwnProps(this.state, nextState)) return true;
    return false;
  }

  componentDidUpdate() {
    if (!this.sourcesChanged) return;
    
    // The sources have changed.  Reload the audio element; this should refire all our
    // event handlers on the element.
    this.sourcesChanged = false;
    this.setState({ preloaded: false, error: null }, () => this.audioEl?.load());
  }

  render() {
    const {
      checkReadiness, onCanPlayThrough, onError,
      state: { preloaded, error }
    } = this;
    const { children, src, audioRef, audioProps } = this.decomposeProps(this.props);

    if (src) return <SoundMedia {...audioProps} audioRef={audioRef} src={src} />;

    return (
      <Preloadable preloaded={preloaded} error={error}>
        <audio
          {...audioProps}
          ref={checkReadiness}
          onCanPlayThrough={onCanPlayThrough}
          onError={onError}
        >
          {children}
        </audio>
      </Preloadable>
    );
  }

}

const getSrc = (child) => {
  if (!child) return null;
  const { type, props } = child;
  if (props?.src::is.string()) return props.src;
  else if (type?.src::is.string()) return type.src;
  return null;
};

const getFirstSrc = (children) => {
  let result = null;

  React.Children.forEach(children, (child) => {
    if (result) return;
    const src = getSrc(child);
    if (src) result = src;
  });
  
  return result;
};

export default Audio;