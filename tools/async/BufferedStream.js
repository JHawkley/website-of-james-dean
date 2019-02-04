import { identityFn } from "tools/common";
import CallSync from "tools/async/CallSync";
import Stream from "tools/async/Stream";

/**
 * A class that provides values as a stream through an async-iterator.  If another operation has not yet
 * started awaiting the async-iterator, the values will be placed into a buffer until the next await.
 * Iteration will end once `done` or `error` is called.
 *
 * @export
 * @template T
 * @class BufferedStream
 */
export default class BufferedStream {

  static doneMessage = Stream.doneMessage;

  static mixin(state) {
    const { callSync } = state;
    return Object.assign(Stream.mixin(state), {
      emit: {
        value: (value) => {
          if (state.done) return this;
          if (callSync.awaitingSync) state.buffer.push(value);
          else callSync.resolve(value);
          return this;
        }
      },
      [Symbol.asyncIterator]: {
        value: async function*() {
          while (!state.done) {
            if (state.buffer.length > 0) {
              yield* state.buffer;
              state.buffer = [];
            }
            const emitted = await callSync.sync;
            if (emitted === BufferedStream.doneMessage) break;
            yield emitted;
          }
          if (state.error) throw state.error;
        }
      }
    });
  }

  /**
   * Creates an instance of BufferedStream.
   * 
   * @param {function(Promise<T>): Promise<U>} [promiseDecorator=identityFn]
   * @memberof BufferedStream
   */
  constructor(promiseDecorator = identityFn) {
    Object.defineProperties(this, BufferedStream.mixin({
      callSync: new CallSync(promiseDecorator),
      buffer: [],
      error: void 0,
      done: false
    }));
  }

  /**
   * Whether the stream is completed, either via calling `done` or `error`.
   * 
   * @property {boolean} BufferedStream#isCompleted
   */

  /**
   * Whether the stream completed with an error.
   * 
   * @property {boolean} BufferedStream#didError
   */

  /**
   * Completes the stream.
   * 
   * @function BufferedStream#done
   * @returns {this}
   */

  /**
   * Emits a value to anything iterating on it and awaiting a value.  If nothing is awaiting a value,
   * the given value will be added to a buffer and will be emitted when the next await occurs.
   * 
   * @function BufferedStream#emit
   * @param {T} value The value to emit.
   * @returns {this}
   */

  /**
   * Ends the stream with an error.
   * 
   * @function BufferedStream#error
   * @param {*} reason The reason behind the stream ending with an error.
   * @returns {this}
   */

  /**
   * Creates an async-iterator for this `BufferedStream`.  It will yield values until `done` or `error`
   * has been called.
   * 
   * @function BufferedStream#{@link Symbol.asyncIterator}
   * @returns {AsyncIterator<T>} An `AsyncIterator` for this object.
   */

}