import React from "react";
import PropTypes from "prop-types";
import PreloadSync from "components/Preloader/PreloadSync";
import { is } from "tools/common";

const isProduction = process.env.NODE_ENV === 'production';

const $$preloadable = Symbol("preloader:preloadable");

class Preloadable extends React.PureComponent {

  static [$$preloadable] = true;

  static propTypes = { preloadSync: PropTypes.instanceOf(PreloadSync) };

  static mark(Component) {
    Component[$$preloadable] = true;
    return Component;
  }

  static test(Component) {
    return Component[$$preloadable] === true;
  }

  state = {
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
    this.setState({ preloaded: false, error: reason ?? new Error("preload failed without a reason") });
  }

  componentDidMount() {
    const { preloaded, error } = this.state;
    this.props.preloadSync?.update(this, preloaded, error);
  }

  componentDidUpdate(prevProps, prevState) {
    const { props: { preloadSync }, state: { preloaded, error } } = this;
    let forceUpdate = false;

    if (preloadSync !== prevProps.preloadSync) {
      prevProps.preloadSync?.dismount(this);
      forceUpdate = Boolean(preloaded || error);
    }

    if (forceUpdate || preloaded !== prevState.preloaded || error !== prevState.error)
      preloadSync?.update(this, preloaded, error);
  }

  componentWillUnmount() {
    this.props.preloadSync?.dismount(this);
    this.didUnmount = true;
  }

  render() { return null; }
  
}

const wrapped = (Component, options) => {
  if (!Component::is.func())
    throw new TypeError("expected argument `promise` to be a function");

  const properName = options?.name ?? Component.displayName ?? Component.name ?? "[anonymous component]";
  const initialProps = options?.initialProps;

  if (Component[$$preloadable] === true) {
    if (!initialProps) return Component;
    
    const Wrapped = (givenProps) => <Component {...initialProps} {...givenProps} />;
    Wrapped.displayName = `Preloadable.wrapped(${properName})`;
    return Preloadable.mark(Wrapped);
  }

  return class extends Preloadable {

    static displayName = `Preloadable.wrapped(${properName})`;

    render() {
      const {
        handlePreloaded, handlePreloadError,
        props: {
          preloadSync, // eslint-disable-line no-unused-vars
          ...childProps
        }
      } = this;
      const props = initialProps ? {...initialProps, ...childProps} : childProps;
      return <Component {...props} onLoaded={handlePreloaded} onError={handlePreloadError} />;
    }
    
  };
};

const rendered = (renderFn, options) => {
  if (!renderFn::is.func())
    throw new TypeError("expected argument `renderFn` to be a function");
  
  const properName = options?.name ?? renderFn.name ?? "[unknown]";
  const initialProps = options?.initialProps;

  return class extends Preloadable {

    static displayName = `Preloadable.rendered(${properName})`;

    render() {
      const {
        handlePreloaded, handlePreloadError, handleResetPreload,
        props: {
          preloadSync, // eslint-disable-line no-unused-vars
          ...childProps
        }
      } = this;
      const props = initialProps ? {...initialProps, ...childProps} : childProps;
      return renderFn(props, handlePreloaded, handlePreloadError, handleResetPreload);
    }
    
  };
};

const promised = (promise, options) => {
  if (!promise::is.defined())
    throw new TypeError("expected argument `promise` to be defined");

  const properName = options?.name ?? promise.name ?? "[unknown]";
  const initialProps = options?.initialProps;

  return class extends Preloadable {

    static propTypes = {
      ...Preloadable.propTypes,
      render: PropTypes.oneOf([
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
    }

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
        props: { preloadSync, render, ...childProps },
        state: { value }
      } = this;

      if (!render)
        return null;
      
      const props = initialProps ? {...initialProps, ...childProps} : childProps;

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