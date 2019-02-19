import { is } from "tools/common";
import { Stream, debounce } from "tools/async";
import { extensions as asyncIterEx } from "tools/asyncIterables";
import PreloadError from "components/Preloader/PreloadError";

const $$fresh = Symbol("preload-sync:fresh");
const $$preloading = Symbol("preload-sync:preloading");
const $$preloaded = Symbol("preload-sync:preloaded");

class PreloadSync {

  static states = {
    fresh: $$fresh,
    preloading: $$preloading,
    preloaded: $$preloaded
  };

  errorHandler = null;
  preloading = new Set();
  stream = new Stream();
  updates = this.stream::asyncIterEx.fromLatest();
  state = $$fresh;

  constructor(errorHandler) {
    this.errorHandler = errorHandler;
  }

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

    if (error) this.handleError(source, error);
    else if (!preloaded) this.mount(source);
    else this.dismount(source);
  }

  handleError(source, error) {
    if (!error::is.instanceOf(PreloadError))
      error = PreloadError.wrap(error);
    
    if (this.errorHandler?.(error) === true) {
      this.dismount(source);
    }
    else {
      this.stream.fail(error);
      this.preloading.clear();
    }
  }

  mount(source) {
    this.preloading.add(source);
    this.setState($$preloading);
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

export default PreloadSync;