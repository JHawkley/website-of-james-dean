import React from "react";
import PropTypes from "prop-types";
import { is, dew } from "tools/common";
import { extensions as arrEx } from "tools/array";
import { extensions as propTypeEx, hasOwn as propTypeHasOwn } from "tools/propTypes";
import { Preloadable } from "components/Preloader";
import SoundMedia from "components/SoundMedia";

const $$sourceable = Symbol("audio:sourceable");

const isSourceable = (obj) => obj::is.func() && obj[$$sourceable] === true;

const isChildrenValid = dew(() => {
  const isProblemChild = (child, i) => {
    if (!child) return false;
    const { type, props } = child;
    if (type === "source") return false;
    if (!type::is.string()) {
      if (isSourceable(type)) return false;
      if (type?.src::is.string()) return false;
      if (props?.src::is.string()) return false;
    }

    if (type::is.func()) {
      const name = type.displayName ?? type.name;
      if (name) return `the child component \`${name}\` at position ${i} could not be used as an audio-source`;
    }

    return `the child with type \`${type}\` at position ${i} could not be used as an audio-source`;
  }

  return function isChildrenValid(children) {
    if (React.Children.count(children) === 0)
      return "the `Audio` component requires at least one child to act as an audio-source";
    
    const problemChildren = React.Children.map(isProblemChild).filter(Boolean);
    if (problemChildren.length > 0) return problemChildren;
    return true;
  };
});

class Audio extends Preloadable {

  static markSourceable(fn) {
    if (!fn::is.func())
      throw new Error("only components (as in functions) can be marked as sourceable");
    fn[$$sourceable] = true;
    return fn;
  }

  static isSourceable = isSourceable;

  static sourceFromObj(obj) {
    if (!obj) return null;
    const { src, type: baseType, codec } = obj;
    if (!src) return null;
    const type = baseType ? (codec ? `${baseType}; codecs=${codec}` : baseType) : null;
    return <source key={src} src={src} type={type} />;
  }

  static propTypes = {
    ...Preloadable.propTypes,
    src:
      PropTypes.string
      ::propTypeEx.notEmpty().isRequired
      ::propTypeEx.exclusiveTo("children"),
    children:
      PropTypes.node
      ::propTypeEx.predicate(isChildrenValid).isRequired
      ::propTypeEx.exclusiveTo("src", true),
    audioRef: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({ current: propTypeHasOwn })
    ])
  };

  static getDerivedStateFromProps({ src, children }, { renderData }) {
    if (src) return { renderData: null };
    if (renderData && children === renderData.children) return null;
    const sources = processChildren(children);
    return { renderData: { children, sources } };
  }

  get haveRenderData() {
    const { renderData } = this.state;
    return renderData && renderData.sources.length > 0;
  }

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
    const src = getFirstSrc(this.props.children);
    const msg = ["sound failed to load"];
    if (src) msg.push(src);
    this.handlePreloadError(new Error(msg.join(": ")));
  }

  componentDidMount() {
    super.componentDidMount();
    if (!this.haveRenderData) this.handlePreloaded();
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);
    const { props: { src, children }, haveRenderData } = this;
    let resetPreload = false;
    let preloadDone = false;

    if (src !== prevProps.src) preloadDone = Boolean(src);

    if (!src && children !== prevProps.children) {
      if (haveRenderData && !this.audioIsReady)
        resetPreload = true;
      else
        preloadDone = true;
    }

    if (resetPreload) this.handleResetPreload();
    if (preloadDone) this.handlePreloaded();
  }

  render() {
    const {
      checkReadiness, onCanPlayThrough, onError,
      props: {
        src, preloadSync, audioRef,
        children, // eslint-disable-line no-unused-vars
        ...audioProps
      },
      state: { renderData }
    } = this;

    if (src)
      return <SoundMedia {...audioProps} preloadSync={preloadSync} audioRef={audioRef} src={src} />;

    return (
      <audio
        {...audioProps}
        ref={checkReadiness}
        onCanPlayThrough={onCanPlayThrough}
        onError={onError}
      >
        { renderData?.sources }
      </audio>
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

const processChildren = (childrenTree) => {
  return React.Children.toArray(childrenTree)::arrEx.collect((child) => {
    if (!child)
      return void 0;
    
    const { type, props } = child;
    
    if (type === "source")
      return child;
    
    if (isSourceable(type))
      return props.asSource ? child : React.cloneElement(child, { asSource: true });
    
    const sourceFromType = Audio.sourceFromObj(type);
    if (sourceFromType) return sourceFromType;

    const sourceFromProps = Audio.sourceFromObj(props);
    if (sourceFromProps) return sourceFromProps;

    return void 0;
  });
};

export default Audio;