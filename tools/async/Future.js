import NotSupportedError from "lib/NotSupportedError";
import { identityFn } from "tools/common";

/**
 * A class that represents a promise that is resolved or rejected elsewhere.
 *
 * @export
 * @template T,U
 * @class Future
 */
export default class Future {

  /**
   * Creates an instance of Future.
   * 
   * @param {function(Promise<T>): Promise<U>} [promiseDecorator=identityFn]
   * @memberof Future
   */
  constructor(promiseDecorator = identityFn) {
    let didComplete = false;
    let error = void 0;
    // These are set when the promise instantiated.
    let resolveFn = null;
    let rejectFn = null;

    /**
     * The future's promise.
     * 
     * @property {Promise<U>} Future#promise
     * @readonly
    */
    Object.defineProperty(this, "promise", {
      value: promiseDecorator(new Promise((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      }))
    });

    /**
     * Whether the future has been resolved or rejected already.
     * 
     * @property {boolean} Future#isCompleted
     * @readonly
    */
    Object.defineProperty(this, "isCompleted", {
      get: () => didComplete
    });

    /**
     * Whether the future has been resolved.  If the future has not yet completed or was rejected,
     * it will be `false`.
     * 
     * @property {boolean} Future#didResolve
     * @readonly
    */
    Object.defineProperty(this, "didResolve", {
      get: () => didComplete && !error
    });

    /**
     * Whether the future has been rejected.  If the future has not yet completed or was resolved,
     * it will be `false`.
     * 
     * @property {boolean} Future#didError
     * @readonly
    */
    Object.defineProperty(this, "didError", {
      get: () => Boolean(error)
    });

    /**
     * Gets the error of this future.
     * 
     * @property {*} Future#error
     * @readonly
    */
    Object.defineProperty(this, "error", {
      get: () => error
    });

    /**
     * Resolves the future's promise.
     * 
     * @function Future#resolve
     * @param {T} value The value to resolve the future's promise with.
     */
    Object.defineProperty(this, "resolve", {
      value: (value) => {
        if (didComplete)
          throw new NotSupportedError("this future has already completed");

        didComplete = true;
        resolveFn(value);
        return this;
      }
    });

    /**
     * Rejects the future's promise.
     * 
     * @function Future#reject
     * @param {*} reason The reason for the rejection.
     */
    Object.defineProperty(this, "reject", {
      value: (reason) => {
        if (didComplete)
          throw new NotSupportedError("this future has already completed");
        
        didComplete = true;
        error = reason;
        rejectFn(reason);
        return this;
      }
    });
  }

}