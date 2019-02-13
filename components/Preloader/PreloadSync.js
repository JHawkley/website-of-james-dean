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
      if (!error::is.instanceOf(PreloadError))
        error = PreloadError.wrap(error);
      this.stream.fail(error);
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

export default PreloadSync;