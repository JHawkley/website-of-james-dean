import mitt from "next/dist/next-server/lib/mitt";
import { is } from "tools/common";
import { Stream, debounce } from "tools/async";
import { extensions as asyncIterEx } from "tools/asyncIterables";
import PreloadError from "components/Preloader/PreloadError";

const $completed = "completed";
const $done = "done";
const $failed = "failed";
const $hasImportantSourcesChanged = "hasImportantSourcesChanged";

const $$fresh = Symbol("preload-sync:fresh");
const $$preloading = Symbol("preload-sync:preloading");
const $$preloaded = Symbol("preload-sync:preloaded");

class PreloadSync {

  static states = {
    fresh: $$fresh,
    preloading: $$preloading,
    preloaded: $$preloaded
  };

  events = mitt();

  preloading = new Set();
  importantOnes = new Set();

  state = $$fresh;
  stream = new Stream();
  updates = this.stream::asyncIterEx.fromLatest();

  get isCompleted() { return this.stream.isCompleted; }
  get didError() { return this.stream.didError; }
  get isDone() { return this.isCompleted && !this.didError; }

  constructor(errorHandler) {
    this.errorHandler = errorHandler;
  }

  // Public methods.

  rendered = debounce(() => {
    if (this.isCompleted) return;
    if (this.state !== $$fresh) return;
    this.setState($$preloaded);
  });

  done() {
    if (this.isCompleted) return;
    this.stream.done();
    this.handleTearDown(true);
  }

  update(source, preloaded, error, important = false) {
    if (this.isCompleted) return;

    if (error) this.handleError(source, error);
    else if (!preloaded) this.mount(source, important);
    else this.dismount(source);
  }

  // Private methods.

  handleTearDown(fromDone) {
    this.preloading.clear();
    this.importantOnes.clear();

    if (fromDone) this.events.emit($done);
    else this.events.emit($failed);

    this.events.emit($completed);
  }

  handleImportantSource(source, adding) {
    const hasSource = this.importantOnes.has(source);

    if (adding) {
      if (hasSource) return;
      const formerSize = this.importantOnes.size;
      this.importantOnes.add(source);
      if (formerSize === 0)
        this.events.emit($hasImportantSourcesChanged, true);
    }
    else {
      if (!hasSource) return;
      this.importantOnes.delete(source);
      if (this.importantOnes.size === 0)
        this.events.emit($hasImportantSourcesChanged, false);
    }
  }

  handleError(source, error) {
    if (!error::is.instanceOf(PreloadError))
      error = PreloadError.wrap(error);
    
    if (this.errorHandler?.(error) === true) {
      this.dismount(source);
    }
    else {
      this.stream.fail(error);
      this.handleTearDown(false);
    }
  }

  mount(source, important) {
    this.preloading.add(source);
    this.handleImportantSource(source, important);
    this.setState($$preloading);
  }

  dismount(source) {
    this.handleImportantSource(source, false);

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

export default PreloadSync;