import { is } from "tools/common";
import { extensions as arrEx } from "tools/array";
import { Future, CallSync, abortable } from "tools/async";
import { isAborted, abortionReason } from "tools/extensions/async";

const $waitingToStart = (n) => n ? `waiting to start the \`${n}\` task` : "waiting to start the task";
const $startedRunning = (n) => n ? `started running the \`${n}\` task` : "started running the task";
const $stoppedRunning = (n) => n ? `stopped running the \`${n}\` task` : "stopped running the task";

const $threwAnError = "the executor threw an error";
const $restartWasCalled = "restart was called";
const $completedNormally = "completed normally";

const makeFuture = () => new Future(p => p::abortionReason());

/**
 * A class that simplifies the management of asynchronous tasks.  Permits only one instance of the task
 * to execute at a time.
 *
 * @template T
 * @class Task
 * @export
 */
export default class Task {

  _running = null;

  get name() {
    return this.executor?.name;
  }

  /**
   * Indicates if the task is currently running.
   *
   * @property {boolean} started
   * @readonly
   * @memberof Task
   */
  get started() {
    return this._startedFuture.isCompleted;
  }

  /**
   * Gets a promise that will resolve when this task has started.  If the task is already started, the
   * promise will already be resolved.
   *
   * @property {Promise<string>} whenStarted
   * @readonly
   * @memberof Task
   */
  get whenStarted() {
    return this._startedFuture.promise;
  }

  /**
   * Gets a promise that will resolve when this task has stopped.  If the task is already stopped, the
   * promise will already be resolved.
   *
   * @property {Promise<string>} whenStopped
   * @readonly
   * @memberof Task
   */
  get whenStopped() {
    return this._stoppedFuture.promise;
  }

  /**
   * Creates an instance of Task.
   *
   * @param {function(Promise, ...any): Promise<T>} executor
   *   The function that embodies and executes the task.  The first argument will always be a promise
   *   that, when completed, should cause the executor to abort.
   * @param {*} exclusion
   *   An asynchronous construct, an array of such, or a function that gets such; the task will be aborted
   *   if any of these complete.  Accepts `Promise`, `Future`, and `CallSync` as asynchronous constructs.
   * @memberof Task
   */
  constructor(executor, exclusion) {
    this.executor = executor;
    this.exclusion = exclusion;

    this._startedFuture = makeFuture();
    this._stoppedFuture = makeFuture().resolve($waitingToStart(this.name));
  }

  /**
   * Starts the task, providing the given `args` to the `executor` function.  If the task is already started,
   * this method does nothing.
   *
   * @param {...any} args
   *   The arguments to provide to the executor.
   * @returns {Promise<T>}
   *   A promise that will resolve to the result of the executor.
   * @memberof Task
   */
  start(...args) {
    if (this.started) return this._running;
    return this._start({ abortSignal: null, args });
  }

  /**
   * Starts the task, providing the given `args` to the `executor` function.  If `abortSignal` completes
   * while the task is running, the task will be aborted.  If the task is already started, this method
   * does nothing.
   *
   * @param {*} abortSignal
   *   The abort signal.  Technically accepts all the same constructs as the constructor's `exclusion`
   *   argument: `Promise`, `Future`, and `CallSync`, as well as arrays and functions that return these.
   * @param {*} args
   *   The arguments to provide to the executor.
   * @returns {Promise<T>}
   *   A promise that will resolve to the result of the executor.
   * @memberof Task
   */
  startAbortable(abortSignal, ...args) {
    if (this.started) return this._running;
    return this._start({ abortSignal, args });
  }

  /**
   * Stops the task if it is running, then starts the task, providing the given `args` to the `executor`
   * function.
   *
   * @param {...any} args
   *   The arguments to provide to the executor.
   * @returns {Promise<T>}
   *   A promise that will resolve to the result of the executor.
   * @memberof Task
   */
  restart(...args) {
    this.stop($restartWasCalled);
    return this._start({ abortSignal: null, args });
  }

  /**
   * Stops the task if it is running, then starts the task, providing the given `args` to the `executor`
   * function.  If `abortSignal` completes while the task is running, the task will be aborted.
   *
   * @param {*} abortSignal
   *   The abort signal.  Technically accepts all the same constructs as the constructor's `exclusion`
   *   argument: `Promise`, `Future`, and `CallSync`, as well as arrays and functions that return these.
   * @param {*} args
   *   The arguments to provide to the executor.
   * @returns {Promise<T>}
   *   A promise that will resolve to the result of the executor.
   * @memberof Task
   */
  restartAbortable(abortSignal, ...args) {
    this.stop($restartWasCalled);
    return this._start({ abortSignal, args });
  }

  /**
   * Stops the task, providing the given message as the reason for stopping.  Does nothing if the task
   * if the task is not started.
   *
   * @param {string} stopReason The reason for stopping the task.
   * @returns {Promise<string>} A promise that will resolve when this task has stopped.
   * @memberof Task
   */
  stop(stopReason) {
    if (this.started) {
      const stoppedMsg = [$stoppedRunning(this.name)];
      if (stopReason::is.string()) stoppedMsg.push(stopReason)
      this._startedFuture = makeFuture();
      this._stoppedFuture.resolve(stoppedMsg.join(": "));
      this._running = null;
    }

    return this.whenStopped;
  }

  _start({abortSignal, args}) {
    this._startedFuture.resolve($startedRunning(this.name));
    this._stoppedFuture = makeFuture();

    const stopSignal = makeTaskAborter([this.whenStopped, this.exclusion, abortSignal]);
    stopSignal.catch(this._catchErrors);
    
    this._running = this._execute(stopSignal, args);
    return this._running;
  }

  _execute(stopSignal, args) {
    if (this.started) {
      // Cleared to start the executor.
      const executor = this.executor;
      const executing = new Promise(resolve => resolve(executor(stopSignal, ...args)));
      // Attach handlers to clean up after it is done.
      executing.then(this._completeNormally, this._catchErrors);
      return executing;
    }
    else {
      // The stop signal fired before we even started.  Just wrap the `stopSignal` to propagate
      // the reason behind the stop.
      return Promise.resolve(stopSignal);
    }
  }

  _completeNormally = () => {
    this.stop($completedNormally);
  }

  _catchErrors = (error) => {
    if (error::isAborted())
      this.stop(`aborted - ${error.message}`);
    else
      this.stop($threwAnError);
  }

}

const makeTaskAborter = (taskStoppers) => {
  switch (true) {
    case taskStoppers == null: return void 0;
    case taskStoppers::is.array(): return Promise.race(taskStoppers::arrEx.collect(makeTaskAborter));
    case taskStoppers::is.func(): return makeTaskAborter(taskStoppers());
    case taskStoppers instanceof Future: return abortable(null, taskStoppers.promise);
    case taskStoppers instanceof CallSync: return abortable(null, taskStoppers.sync);
    default: return abortable(null, taskStoppers);
  }
};