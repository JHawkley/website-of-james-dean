import { is } from "tools/common";

/**
 * An error that represents an aborted promise.
 *
 * @export
 * @class AbortedError
 * @extends {Error}
 */
export default class AbortedError extends Error {

  /**
   * Creates an instance of AbortedError.
   * 
   * @param {Promise} mainPromise The promise that was aborted.
   * @param {Promise} signalPromise The promise that was used as the abortion signal.
   * @param {string} [message] A message describing the reason why the abortion occurred.
   * @memberof AbortedError
   */
  constructor(mainPromise, signalPromise, message) {
    super(message::is.string() ? message : "the promise was aborted");
    Error.captureStackTrace?.(this, AbortedError);

    /**
     * The promise that was aborted.  May be null if `abortable` was called without providing a `mainPromise`.
     * 
     * @property {Promise|null} AbortedError#promise
     */
    this.promise = mainPromise ?? null;

    /**
     * The promise that caused the abortion.
     * 
     * @property {Promise} AbortedError#signal
     */
    this.signal = signalPromise;
  }

}