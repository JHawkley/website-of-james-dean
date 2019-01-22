import PropTypes from "prop-types";
import { dew, is, Composition } from "tools/common";
import { Stream, CallSync, debounce } from "tools/async";
import { extensions as asyncIterEx } from "tools/asyncIterables";
import { extensions as classEx } from "tools/classes";

const isProduction = process.env.NODE_ENV === 'production';

const $always = "always";
const $loaded = "loaded";
const $never = "never";

const $$preloadable = Symbol("preloader:preloadable");

const $$fresh = Symbol("preload-sync:fresh");
const $$preloading = Symbol("preload-sync:preloading");
const $$preloaded = Symbol("preload-sync:preloaded");

class Preloader extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node.isRequired,
    preloadSync: PropTypes.instanceOf(PreloadSync),
    onPreload: PropTypes.func,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    display: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.oneOf([$always, $loaded, $never])
    ]),
    wait: PropTypes.bool,
    once: PropTypes.bool
  };

  static defaultProps = {
    display: $loaded,
    wait: false,
    once: false
  };

  static sync() {
    return new PreloadSync();
  }

  static getDerivedStateFromProps(props, state) {
    const newState = new Composition();

    if (props.preloadSync && props.preloadSync !== state.preloadSync)
      newState.compose({ preloadSync: props.preloadSync, ownedPreloadSync: false });
    else if (!state.preloadState)
      newState.compose({ preloadSync: new PreloadSync(), ownedPreloadSync: true });

    if (!state.mustRender && !props.wait)
      newState.compose({ mustRender: true });

    return newState.composed ? newState.result : null;
  }

  cancelAsync = new CallSync();

  state = {
    ownedPreloadSync: false,
    preloadSync: null,
    preloadState: $$fresh,
    preloadedOnce: false,
    mustRender: !this.props.wait,
    error: null
  };

  get display() {
    switch (this.props.display) {
      case true: return $always;
      case false: return $never;
      default: return this.props.display;
    }
  }

  preloadSyncUpdated = (newPreloadState) => {
    const { props: { once }, state: { preloadedOnce, preloadState, error } } = this;
    if (once && preloadedOnce) return;
    if (preloadState === newPreloadState) return;
    if (error) return;

    const newState = new Composition({ preloadState: newPreloadState });
    if (newPreloadState === $$preloaded && !preloadedOnce)
      newState.compose({ preloadedOnce: true });
    this.setState(newState.result);
  }

  attachToPreloadSync() {
    const { preloadSyncUpdated, cancelAsync, state: { preloadSync } } = this;
    preloadSync.updates::asyncIterEx.forEach(preloadSyncUpdated, cancelAsync.sync).catch((error) => {
      this.setState({ error });
    });
    preloadSync.rendered();
  }

  componentDidMount() {
    this.attachToPreloadSync();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      props: { once },
      state: { error, preloadSync, preloadState, ownedPreloadSync }
    } = this;

    if (error !== prevState.error && error) {
      const { onError } = this.props;
      if (!onError) throw error;
      return onError(error);
    }
    
    if (preloadState !== prevState.preloadState) {
      switch (preloadState) {
        case $$preloading:
          this.props.onPreload?.();
          break;
        case $$preloaded:
          this.props.onLoad?.();
          break;
      }
    }

    if (once !== prevProps.once && !once)
      if (preloadSync.state !== preloadState)
        this.preloadSyncUpdated(preloadSync.state);
    
    if (preloadSync !== prevState.preloadSync) {
      if (ownedPreloadSync) prevState.preloadSync.done();
      this.cancelAsync.resolve();
      this.attachToPreloadSync();
    }
  }

  componentWillUnmount() {
    const { ownedPreloadSync, error, preloadSync } = this.state;
    if (ownedPreloadSync && !error) preloadSync.done();
    this.cancelAsync.resolve();
  }

  render() {
    const {
      display,
      props: { style: customStyle, className },
      state: { mustRender, error, preloadSync, preloadState }
    } = this;

    if (!mustRender || error)
      return null;

    const children = processChildren(this.props.children, preloadSync);

    const hide = dew(() => {
      switch (display) {
        case $always: return false;
        case $never: return true;
        default: return preloadState !== $$preloaded;
      }
    });

    const style = Object.assign({}, customStyle, hide ? { display: "none" } : null);

    return <div className={className} style={style}>{children}</div>;
  }

}

class Preloadable extends React.PureComponent {

  static [$$preloadable] = true;

  static propTypes = { preloadSync: PropTypes.instanceOf(PreloadSync) };

  static rendered(renderFn, name = renderFn.name ?? "[unknown]") {
    return class extends Preloadable {

      static displayName = `Preloadable.rendered(${name})`;

      render() {
        const { handlePreloaded, handlePreloadError, childProps } = this;
        return renderFn(childProps, handlePreloaded, handlePreloadError);
      }
      
    };
  }

  static wrapped(Component, name = nameOf(Component)) {
    if (Component[$$preloadable] === true) return Component;

    return class extends Preloadable {

      static displayName = `Preloadable.wrapped(${name})`;

      render() {
        const { handlePreloaded, handlePreloadError, childProps } = this;
        return <Component {...childProps} onLoaded={handlePreloaded} onError={handlePreloadError} />;
      }
      
    };
  }

  static promised(promise, name = "[unknown]") {
    return class extends Preloadable {

      static propTypes = { ...Preloadable.propTypes, component: PropTypes.bool };

      static displayName = `Preloadable.promised(${name})`;

      constructor(props) {
        super(props);
        this.state.rendered = null;
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
          if (this.props.component && !rendered::is.func()) {
            console.warn(`the promise provided to \`Preloadable.promised(${name})\` did not result in a component`);
            console.dir({ rendered, childProps: this.childProps });
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

        const Component = rendered;
        if (Component[$$preloadable] === true)
          return <Component {...childProps} preloadSync={preloadSync} />;
        else
          return <Component {...childProps} />;
      }

    };
  }

  state = {
    preloaded: false,
    error: null
  };

  isUnmounted = false;

  get childProps() {
    const {
      preloadSync, // eslint-disable-line no-unused-vars
      ...childProps
    } = this.props;
    return childProps;
  }

  get isCompleted() { return this.state.preloaded || this.state.error || this.isUnmounted }

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

class PreloadSync {

  static states = {
    fresh: $$fresh,
    preloading: $$preloading,
    preloaded: $$preloaded
  };

  preloading = new Set();
  stream = new Stream();
  updates = this.stream::asyncIterEx.fromLatest();
  state = $$fresh;

  rendered = debounce(() => {
    if (this.stream.isCompleted) return;
    if (this.state !== $$fresh) return;
    this.setState($$preloaded);
  });

  done() {
    if (this.stream.isCompleted) return;
    this.stream.done();
    this.preloading.clear();
  }

  update(source, preloaded, error) {
    if (this.stream.isCompleted) return;

    if (error) {
      this.stream.error(error);
      this.preloading.clear();
    }
    else if (!preloaded) {
      this.preloading.add(source);
      this.setState($$preloading);
    }
    else {
      this.dismount(source);
    }
  }

  dismount(source) {
    if (this.preloading.has(source)) {
      this.preloading.delete(source);
      if (this.preloading.size === 0)
        this.setState($$preloaded);
    }
  }

  setState(value) {
    if (this.state === value) return;
    this.state = value;
    this.stream.emit(value);
  }

}

const processChildren = (children, preloadSync) => {
  const processChild = (child) => {
    if (!child || !child::is.object()) return child;

    if (child.type::is.func()) {
      if (child.type::classEx.inheritsFrom(Preloader))
        return child;
      if (child.type[$$preloadable] === true)
        return React.cloneElement(child, { preloadSync });
    }

    const oldChildren = child.props?.children;
    const newChildren = processChildren(oldChildren);
    if (oldChildren === newChildren) return child;
    return React.cloneElement(child, null, newChildren);
  };

  const processChildren = (children) => {
    if (!children) return children;
    const arrayOfChildren = Array.isArray(children) ? children : [children];
    if (arrayOfChildren.length === 0) return children;
    return arrayOfChildren.map(processChild);
  };
  
  return processChildren(children);
};

const nameOf = (Component) => Component.displayName ?? Component.name ?? "[anonymous component]";

export default Preloader;
export { Preloadable, $$preloadable as symbol };