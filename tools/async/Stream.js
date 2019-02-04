import { identityFn } from "tools/common";
import CallSync from "tools/async/CallSync";

/**
 * A class that provides values as a stream through an async-iterator.  Iteration will end once `done`
 * or `error` is called.
 *
 * @export
 * @template T,U
 * @class Stream
 */
export default class Stream {

  static doneMessage = Symbol("stream:done");

  static mixin(state) {
    const { callSync } = state;
    return {
      isCompleted: { get: () => state.done },
      didError: { get: () => state.error != null },
      error: { get: () => state.error },
      done: {
        value: () => {
          if (state.done) return this;
          state.done = true;
          callSync.resolve(Stream.doneMessage);
          return this;
        }
      },
      emit: {
        value: (value) => {
          if (!state.done) callSync.resolve(value);
          return this;
        }
      },
      fail: {
        value: (reason) => {
          if (state.done) return this;
          state.error = reason;
          state.done = true;
          callSync.reject(reason);
          return this;
        }
      },
      [Symbol.asyncIterator]: {
        value: async function*() {
          while (!state.done) {
            const emitted = await callSync.sync;
            if (emitted === Stream.doneMessage) break;
            yield emitted;
          }
          if (state.error) throw state.error;
        }
      }
    };
  }

  /**
   * Creates an instance of Stream.
   * 
   * @param {function(Promise<T>): Promise<U>} [promiseDecorator=identityFn]
   * @memberof Stream
   */
  constructor(promiseDecorator = identityFn) {
    Object.defineProperties(this, Stream.mixin({
      callSync: new CallSync(promiseDecorator),
      error: void 0,
      done: false
    }));
  }

  /**
   * Whether the stream is completed, either via calling `done` or `error`.
   * 
   * @property {boolean} Stream#isCompleted
   */

  /**
   * Whether the stream completed with an error.
   * 
   * @property {boolean} Stream#didError
   */

  /**
   * Completes the stream.
   * 
   * @function Stream#done
   * @returns {this}
   */

  /**
   * Emits a value to anything iterating on it and awaiting a value.
   * 
   * @function Stream#emit
   * @param {T} value The value to emit.
   * @returns {this}
   */

  /**
   * Ends the stream with an error.
   * 
   * @function Stream#error
   * @param {*} reason The reason behind the stream ending with an error.
   * @returns {this}
   */

  /**
   * Creates an async-iterator for this `Stream`.  It will yield values until `done` or `error` has
   * been called.
   * 
   * @function Stream#{@link Symbol.asyncIterator}
   * @returns {AsyncIterator<T>} An `AsyncIterator` for this object.
   */

}