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

  isUnmounted = false;

  get isCompleted() {
    return Boolean(this.isUnmounted || this.state.preloaded || this.state.error);
  }

  handleResetPreload = () => {
    if (this.isUnmounted) return;
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
    this.isUnmounted = true;
  }

  render() { return null; }
  
}

const wrapped = (Component, name = nameOf(Component)) => {
  if (Component[$$preloadable] === true) return Component;

  return class extends Preloadable {

    static displayName = `Preloadable.wrapped(${name})`;

    render() {
      const {
        handlePreloaded, handlePreloadError,
        props: {
          preloadSync, // eslint-disable-line no-unused-vars
          ...childProps
        }
      } = this;
      return <Component {...childProps} onLoaded={handlePreloaded} onError={handlePreloadError} />;
    }
    
  };
};

const rendered = (renderFn, name = renderFn.name ?? "[unknown]") => {
  return class extends Preloadable {

    static displayName = `Preloadable.rendered(${name})`;

    render() {
      const {
        handlePreloaded, handlePreloadError, handleResetPreload,
        props: {
          preloadSync, // eslint-disable-line no-unused-vars
          ...childProps
        }
      } = this;
      return renderFn(childProps, handlePreloaded, handlePreloadError, handleResetPreload);
    }
    
  };
};

const promised = (promise, name = "[unknown]") => {
  return class extends Preloadable {

    static propTypes = { ...Preloadable.propTypes, component: PropTypes.bool };

    static displayName = `Preloadable.promised(${name})`;

    state = {
      ...this.state,
      rendered: null
    }

    componentDidMount() {
      super.componentDidMount();

      promise.then(
        (rendered) => this.isCompleted || this.setState({ rendered }, this.handlePreloaded),
        this.handlePreloadError
      );
    }

    componentDidUpdate(prevProps, prevState) {
      super.componentDidUpdate(prevProps, prevState);

      if (!isProduction && this.state.rendered !== prevState.rendered) {
        const rendered = this.state.rendered;
        // eslint-disable-next-line no-unused-vars
        const { preloadSync, component, ...childProps } = this.props;
        if (component && !rendered::is.func()) {
          console.warn(`the promise provided to \`Preloadable.promised(${name})\` did not result in a component`);
          console.dir({ rendered, childProps: childProps });
        }
      }
    }

    render() {
      const {
        props: { preloadSync, component, ...childProps },
        state: { rendered }
      } = this;

      if (!rendered) return null;
      if (!component) return rendered;
      if (!rendered::is.func()) return null;

      const Component = rendered;
      if (Component[$$preloadable] === true)
        return <Component {...childProps} preloadSync={preloadSync} />;
      else
        return <Component {...childProps} />;
    }

  };
};

const nameOf = (Component) => Component.displayName ?? Component.name ?? "[anonymous component]";

export default Preloadable;
export { wrapped, rendered, promised };