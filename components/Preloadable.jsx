import React from "react";
import PropTypes from "prop-types";
import BadArgumentError from "lib/BadArgumentError";
import PreloadError from "components/Preloader/PreloadError";
import PreloadContext from "lib/PreloadContext";
import { is, Composition } from "tools/common";
import { memoize } from "tools/functions";
import { asError } from "tools/extensions/errors";

const $badFunction = "must be a function";
const $notDefined = "must be defined";
const $badProp = "when provided, must be a non-empty string";

class Preloadable extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node,
    preloaded: PropTypes.bool.isRequired,
    error: PropTypes.any
  };

  static contextType = PreloadContext;

  state = { preloadSync: null };

  componentDidMount() {
    this.setState({ preloadSync: this.context });
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      context: preloadContext,
      props: { preloaded, error },
      state: { preloadSync }
    } = this;

    let forceUpdate = false;

    if (preloadContext !== preloadSync) {
      this.setState({ preloadSync: preloadContext });
      return;
    }

    if (preloadSync !== prevState.preloadSync) {
      prevState.preloadSync?.dismount?.(this);
      forceUpdate = true;
    }

    if (forceUpdate || preloaded !== prevProps.preloaded || error !== prevProps.error)
      preloadSync?.update?.(this, preloaded, error);
  }

  componentWillUnmount() {
    const { preloadSync } = this.state;
    preloadSync?.dismount?.(this);
    this.didUnmount = true;
  }

  render() { return this.props.children; }
  
}

const wrapped = (Component, options) => {
  if (!Component::is.func())
    throw new BadArgumentError($badFunction, "Component", Component);

  const properName = (options?.name ?? Component.displayName ?? Component.name) || "[anonymous component]";
  const initialProps = options?.initialProps;

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

  return class extends React.PureComponent {

    static displayName = `Preloadable.wrapped(${properName})`;

    state = {
      preloaded: PropTypes.bool,
      error: PropTypes.any
    };

    didUnmount = false;

    get isCompleted() {
      const { didUnmount, state: { preloaded, error } } = this;
      return didUnmount || Boolean(error) || preloaded;
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
      const error
        = !reason ? new PreloadError("preload failed without a reason")
        : reason::asError();
      this.setState({ preloaded: false, error });
    }

    componentWillUnmount() {
      this.didUnmount = true;
    }

    render() {
      const {
        handlePreloaded, handlePreloadError, handleResetPreload,
        props: givenProps,
        state: { preloaded, error }
      } = this;

      const props = new Composition();
      props.compose(initialProps);
      props.compose(givenProps);

      if (canPreload) props.add(onPreloadProp, handleResetPreload);
      props.add(onLoadProp, handlePreloaded);
      props.add(onErrorProp, handlePreloadError);

      return (
        <Preloadable preloaded={preloaded} error={error}>
          <Component {...props.result} />
        </Preloadable>
      );
    }
    
  };
};

const promised = (promise, options) => {
  if (!promise::is.defined())
    throw new BadArgumentError($notDefined, "promise", promise);

  const properName = (options?.name ?? promise.name) || "[unnamed]";
  const initialProps = options?.initialProps;

  return class extends React.PureComponent {

    static propTypes = {
      render: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({
          loaded: PropTypes.func.isRequired,
          loading: PropTypes.func,
          error: PropTypes.func
        })
      ]).isRequired
    };

    static displayName = `Preloadable.promised(${properName})`;

    state = {
      promiseCompleted: false,
      promiseValue: null,
      error: null
    };

    didUnmount = false;

    decomposeProps = memoize((ownProps) => {
      const { render, ...givenProps } = ownProps;
      const props = initialProps ? {...initialProps, ...givenProps} : givenProps;
      return { render, props };
    });

    handlePromiseResolved = (promiseValue) => {
      if (this.didUnmount) return;
      this.setState({ promiseValue, promiseCompleted: true });
    };

    handlePromiseRejected = (reason) => {
      if (this.didUnmount) return;
      const error
        = !reason ? new PreloadError("promise rejected without a reason")
        : reason::asError();
      this.setState({ promiseCompleted: true, error });
    };

    componentDidMount() {
      Promise.resolve(promise::is.func() ? promise() : promise).then(
        this.handlePromiseResolved,
        this.handlePromiseRejected
      );
    }

    componentWillUnmount() {
      this.didUnmount = true;
    }

    renderViaProp(promiseCompleted, promiseValue, error) {
      const { context: preloadSync } = this;
      const { render, props } = this.decomposeProps(this.props);
      const haveError = Boolean(error);
      const isCompleted = haveError || promiseCompleted;

      switch (true) {
        case !haveError && render::is.func():
          return render(promiseValue, props, preloadSync, isCompleted);
        case haveError && render.error::is.func():
          return render.error(error, props, preloadSync);
        case !isCompleted && render.loading::is.func():
          return render.loading(props, preloadSync);
        case render.loaded::is.func():
          return render.loaded(promiseValue, props, preloadSync);
        default:
          return null;
      }
    }

    render() {
      const { promiseCompleted, promiseValue, error } = this.state;

      return (
        <Preloadable preloaded={promiseCompleted} error={error}>
          {this.renderViaProp(promiseCompleted, promiseValue, error)}
        </Preloadable>
      );
    }

  };
};

export default Preloadable;
export { wrapped, promised };