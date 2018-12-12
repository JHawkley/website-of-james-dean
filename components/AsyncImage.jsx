import PropTypes from "prop-types";
import getConfig from "next/config";
import { dew } from "tools/common";
import { extensions as maybe, nothing } from "tools/maybe";
import { preloadImage, awaitAll, Future } from "tools/async";
import { generateSvgPlaceholder } from "tools/svg";

const isProduction = getConfig().publicRuntimeConfig?.isProduction ?? true;

export default class AsyncImage extends React.PureComponent {

  future = new Future();

  get isCompleted() { return this.future.isCompleted; }

  get currentlyLoading() {
    const { isCompleted, props: { imageSync, phase } } = this;
    return !isCompleted && (imageSync?.loadASAP(phase) ?? true);
  }
  
  static propTypes = {
    src: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    fluid: PropTypes.bool,
    imageSync: (...args) => PropTypes.instanceOf(ImageSync)(...args),
    placeholderColor: PropTypes.string,
    phase: (...args) => {
      const result = PropTypes.number.isRequired(...args);
      if (result::maybe.isDefined()) return result;

      const [props, propName, componentName, location, propFullName] = args;
      const value = props[propName];

      if (value >= 0) return null;

      return new Error([
        `Invalid ${location} \`${propFullName}\` supplied to \`${componentName}\``,
        `supplied value \`${value}\` is not greater-than-or-equal to zero`
      ].join("; "));
    }
  };

  static defaultProps = {
    fluid: false,
    placeholderColor: "#000000",
    phase: 1
  };

  constructor(props) {
    super(props);
    const { imageSync, phase } = props;
    // Render immediately if the ImageSync tells us to do so, or we have no ImageSync.
    // This will ensure loading begins as soon as the pre-rendered HTML is parsed, even before
    // the page is loaded. The ImageSync will still ensure all phase 0 images are loaded before
    // progressing to the next phase.
    const shouldRenderImmediately = imageSync?.loadASAP(phase) ?? true;
    this.state = {
      display: phase === 0 || shouldRenderImmediately,
      error: false
    };
  }

  onPhaseReady = () => {
    const { future, props: { src } } = this;

    // Short-circuit in case the future is already complete.
    if (future.isCompleted) return future.promise;

    const onImageLoad = () => {
      if (future.isCompleted) return;
      future.resolve();
      this.setState({ error: false });
    };
  
    const onImageError = () => {
      if (future.isCompleted) return;
      future.reject();
      this.setState({ error: true });
    };

    preloadImage(src).then(onImageLoad, onImageError);
    this.setState({ display: true });
    
    return future.promise;
  }

  attachHandler() {
    if (this.isCompleted) return;
    const { imageSync, phase } = this.props;
    imageSync?.attachCallback(phase, this.onPhaseReady);
  }

  promiseState(newState) {
    return new Promise(resolve => this.setState(newState, resolve));
  }

  componentDidMount() {
    if (this.props.imageSync::maybe.isEmpty() && !isProduction)
      console.warn(`Warning: AsyncImage where 'src = ${this.props.src}' had no 'imageSync' property.`);
    this.attachHandler();
  }

  componentDidUpdate(prevProps) {
    // Defensive copy, in case these change during the async function.
    const { imageSync: curImageSync, phase: curPhase, src: curSrc } = this.props;
    const { imageSync: prevImageSync, phase: prevPhase, src: prevSrc } = prevProps;

    dew(async () => {
      let reattachHandler = false;

      if (!this.isCompleted && (curPhase !== prevPhase || curImageSync !== prevImageSync)) {
        prevImageSync?.detachCallback(prevPhase, this.onPhaseReady);
        reattachHandler = true;
      }

      if (curSrc !== prevSrc) {
        // Completely reset.
        const lastFuture = this.future;
        if (!lastFuture.isCompleted) lastFuture.reject();
        this.future = new Future();
        await this.promiseState({ display: false, error: false });
        reattachHandler = true;
      }

      if (reattachHandler) this.attachHandler();
    });
  }

  render() {
    const { display } = this.state;
    
    const {
      src, width, height, fluid, placeholderColor, className,
      imageSync, phase, // eslint-disable-line no-unused-vars
      ...imgProps
    } = this.props;

    const imageSrc = display ? src : generateSvgPlaceholder({
      width, height,
      style: { backgroundColor: placeholderColor }
    });

    const key = display ? "src" : "svg";

    if (fluid) {
      const divStyle = {
        width: `${width}px`,
        paddingBottom: `${100.0 / (width / height)}%`
      };
      const klass = className ? `${className} fluid` : "fluid";
      return (
        <div className="fluid-container" style={divStyle}>
          <img {...imgProps} key={key} className={klass} src={imageSrc} width={width} height={height} />
        </div>
      );
    }
    else {
      return <img {...imgProps} key={key} className={className} src={imageSrc} width={width} height={height} />;
    }
  }

}

export class ImageSync {

  nextPhaseToDo = 0;
  phasedCallbacks = {};
  static numericalSort = (a, b) => a - b;

  get allPhasesAreLoaded() { return this.phasedCallbacks::maybe.isEmpty(); }

  // Public APIs below; they are pre-bound and can be used as callbacks.

  loadNextPhase = async () => {
    if (this.allPhasesAreLoaded) return false;
  
    // Get the callbacks for the current phase.
    const currentPhase = this.nextPhaseToDo;
    const callbacks = this.phasedCallbacks[currentPhase]::maybe.map(Array.from) ?? [];
  
    // Before we do anything else, lets update the state.
    // This will curb a race condition, where `loadNextPhrase` may be called while
    // this phase is still being loaded.
    const knownPhases = Object
      .keys(this.phasedCallbacks)
      .map(Number)
      .filter(phase => phase > currentPhase);
    if (knownPhases.length === 0) this.phasedCallbacks = nothing;
    else this.nextPhaseToDo = knownPhases.sort(ImageSync.numericalSort)[0];
  
    // Start all our loading promises and wait for them all to complete.
    await awaitAll(callbacks.map(cb => cb()));
  
    // Finally report if we're done.
    return !this.allPhasesAreLoaded;
  }

  loadToPhase = async (newPhase) => {
    while (newPhase >= this.nextPhaseToDo && await this.loadNextPhase());
    return !this.allPhasesAreLoaded;
  }

  loadAllPhases = async () => {
    while (await this.loadNextPhase());
    return !this.allPhasesAreLoaded;
  }

  // Internal APIs are below.

  loadASAP(phase) { return this.allPhasesAreLoaded || phase < this.nextPhaseToDo; }

  attachCallback(phase, cb) {
    if (this.loadASAP(phase)) cb();
    else {
      const phaseCbs = this.phasedCallbacks[phase] ?? new Set();
      phaseCbs.add(cb);
      this.phasedCallbacks[phase] = phaseCbs;
    }
  }

  detachCallback(phase, cb) {
    if (this.allPhasesAreLoaded) return;
    const phaseCbs = this.phasedCallbacks[phase];
    if (!phaseCbs) return;
    phaseCbs.delete(cb);
  }
  
}

export function importWrapper(src, width, height) {
  const ImportedImage = ({phase = 1, ...props}) => (
    <AsyncImage
      {...props}
      src={src}
      phase={phase}
      width={width}
      height={height}
    />
  );
  ImportedImage.displayName = `importedImage("${src}")`;
  ImportedImage.src = src;
  ImportedImage.preload = () => preloadImage(src, width, height);
  return ImportedImage;
}