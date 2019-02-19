import React from "react";
import PropTypes from "prop-types";
import BadArgumentError from "lib/BadArgumentError";
import PreloadError from "components/Preloader/PreloadError";
import PreloadContext from "lib/PreloadContext";
import { is, Composition } from "tools/common";
import { inheritsFrom } from "tools/extensions/classes";

const $badFunction = "must be a function";
const $notDefined = "must be defined";
const $badProp = "when provided, must be a non-empty string";

class Preloadable extends React.PureComponent {

  static contextType = PreloadContext;

  state = {
    preloadSync: null,
    preloaded: false,
    error: null
  };

  didUnmount = false;

  get isCompleted() {
    return Boolean(this.didUnmount || this.state.preloaded || this.state.error);
  }

  handleResetPreload = () => {
    if (this.didUnmount) return;
    this.setState({ preloaded: false, error: null });
  }

  handlePreloaded = () => {
    if (this.isCompleted) return;
    this.setState({ preloaded: true, error: null });
  }

  handlePreloadError = (reason) => {
    if (this.isCompleted) return;
    const error = reason ?? new PreloadError("preload failed without a reason");
    this.setState({ preloaded: false, error });
  }

  componentDidMount() {
    this.setState({ preloadSync: this.context });
  }

  componentDidUpdate(prevProps, prevState) {
    const { context: preloadContext, state: { preloadSync, preloaded, error } } = this;
    let forceUpdate = false;

    if (preloadContext !== preloadSync) {
      this.setState({ preloadSync: preloadContext });
      return;
    }

    if (preloadSync !== prevState.preloadSync) {
      prevState.preloadSync?.dismount?.(this);
      forceUpdate = true;
    }

    if (forceUpdate || preloaded !== prevState.preloaded || error !== prevState.error)
      preloadSync?.update?.(this, preloaded, error);
  }

  componentWillUnmount() {
    const { preloadSync } = this.state;
    preloadSync?.dismount?.(this);
    this.didUnmount = true;
  }

  render() { return null; }
  
}

const wrapped = (Component, options) => {
  if (!Component::is.func())
    throw new BadArgumentError($badFunction, "Component", Component);

  const properName = (options?.name ?? Component.displayName ?? Component.name) || "[anonymous component]";
  const initialProps = options?.initialProps;

  if (Component::inheritsFrom(Preloadable)) {
    if (!initialProps) return Component;
    
    const Wrapped = (givenProps) => <Component {...initialProps} {...givenProps} />;
    Wrapped.displayName = `Preloadable.wrapped(${properName})`;
    return Wrapped;
  }

  const canPreload = Boolean(options?.onPreloadProp);
  const onPreloadProp = options?.onPreloadProp ?? "onPreload";
  const onLoadProp = options?.onLoadProp ?? "onLoad";
  const onErrorProp = options?.onErrorProp ?? "onError";

  if (!onPreloadProp::is.string() || !onPreloadProp)
    throw new BadArgumentError($badProp, "options.onPreloadProp", options.onPreloadProp);
  if (!onLoadProp::is.string() || !onLoadProp)
    throw new BadArgumentError($badProp, "options.onLoadProp", options.onLoadProp);
  if (!onErrorProp::is.string() || !onErrorProp)
    throw new BadArgumentError($badProp, "options.onErrorProp", options.onErrorProp);

  return class extends Preloadable {

    static displayName = `Preloadable.wrapped(${properName})`;

    render() {
      const { handlePreloaded, handlePreloadError, handleResetPreload, props: givenProps } = this;

      const props = new Composition();
      props.compose(initialProps);
      props.compose(givenProps);

      if (canPreload) props.add(onPreloadProp, handleResetPreload);
      props.add(onLoadProp, handlePreloaded);
      props.add(onErrorProp, handlePreloadError);

      return <Component {...props.result} />;
    }
    
  };
};

const rendered = (renderFn, options) => {
  if (!renderFn::is.func())
    throw new BadArgumentError($badFunction, "renderFn", renderFn);
  
  const properName = (options?.name ?? renderFn.name) || "[unnamed]";
  const initialProps = options?.initialProps;

  return class extends Preloadable {

    static displayName = `Preloadable.rendered(${properName})`;

    render() {
      const { handlePreloaded, handlePreloadError, handleResetPreload, props: givenProps } = this;
      const props = initialProps ? {...initialProps, ...givenProps} : givenProps;
      return renderFn(props, handlePreloaded, handlePreloadError, handleResetPreload);
    }
    
  };
};

const promised = (promise, options) => {
  if (!promise::is.defined())
    throw new BadArgumentError($notDefined, "promise", promise);

  const properName = (options?.name ?? promise.name) || "[unnamed]";
  const initialProps = options?.initialProps;

  return class extends Preloadable {

    static propTypes = {
      render: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({
          loaded: PropTypes.func.isRequired,
          loading: PropTypes.func
        })
      ]).isRequired
    };

    static displayName = `Preloadable.promised(${properName})`;

    state = {
      ...this.state,
      value: null
    };

    componentDidMount() {
      super.componentDidMount();
      const promiseProper = Promise.resolve(promise::is.func() ? promise() : promise);

      promiseProper.then(
        (value) => this.isCompleted || this.setState({ value }, this.handlePreloaded),
        this.handlePreloadError
      );
    }

    render() {
      const {
        context: preloadSync,
        props: { render, ...givenProps },
        state: { value }
      } = this;

      if (!render)
        return null;
      
      const props = initialProps ? {...initialProps, ...givenProps} : givenProps;

      if (render::is.func())
        return render(value, props, preloadSync, this.isCompleted);

      if (!this.isCompleted)
        return render.loading?.(props, preloadSync);
      
      return render.loaded?.(value, props, preloadSync);
    }

  };
};

export default Preloadable;
export { wrapped, rendered, promised };