import { identityFn } from "tools/common";
import Future from "tools/async/Future";

/**
 * A class that provides synchronization services based on a later method call.
 *
 * @export
 * @template T,U
 * @class CallSync
 */
export default class CallSync {

  /**
   * Creates an instance of CallSync.
   * 
   * @param {function(Promise<T>): Promise<U>} [promiseDecorator=identityFn]
   * @memberof CallSync
   */
  constructor(promiseDecorator = identityFn) {
    let nextSync = null;

    /**
     * Indicates `true` when nothing has accessed `sync` since the last `resolve`.
     * 
     * @property {boolean} CallSync#awaitingSync
     * @readonly
     */
    Object.defineProperty(this, "awaitingSync", {
      get: () => nextSync == null
    });

    /**
     * Gets a promise that will be completed with the next call to `resolve` or `reject`.
     * 
     * @property {Promise<U>} CallSync#sync
     * @readonly
     */
    Object.defineProperty(this, "sync", {
      get: () => {
        if (nextSync == null)
          nextSync = new Future(promiseDecorator);
        return nextSync.promise;
      }
    });

    /**
     * Resolves the promise created from the last `sync`, if any.
     * 
     * @function CallSync#resolve
     * @param {T} value The value to resolve the future's promise with.
     * @returns {this}
     */
    Object.defineProperty(this, "resolve", {
      value: (value) => {
        if (nextSync == null) return this;
        nextSync.resolve(value);
        nextSync = null;
        return this;
      }
    });

    /**
     * Rejects the promise created from the last `sync`, if any.
     * 
     * @function CallSync#reject
     * @param {*} reason The reason for the rejection.
     * @returns {this}
     */
    Object.defineProperty(this, "reject", {
      value: (reason) => {
        if (nextSync == null) return this;
        nextSync.reject(reason);
        nextSync = null;
        return this;
      }
    });

    /**
     * Discards the promise created from the last `sync`, if any, without resolving or rejecting it.
     * 
     * @function CallSync#discard
     * @returns {this}
     */
    Object.defineProperty(this, "discard", {
      value: () => {
        nextSync = null;
        return this;
      }
    });
  }

  /**
   * Creates an async-iterator for this `CallSync`.  It will yield values until a rejection occurs.
   * 
   * @memberof CallSync
   * @returns {AsyncIterator<T>} An `AsyncIterator` for this object.
   */
  async *[Symbol.asyncIterator]() {
    while (true) yield await this.sync;
  }

}