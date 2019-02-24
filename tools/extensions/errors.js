import { is } from "tools/common";
import BadArgumentError from "lib/BadArgumentError";

/**
 * Converts an object to an error.
 * If the object is `null` or `undefined`, no conversion is performed.
 * If the object is already an error, it simply returns it.
 * Otherwise, the string-representation of the object will be used to create a new `Error` instance.
 * 
 * @export
 * @this {*} This object.
 * @returns {Error}
 */
export function asError() {
  if (!this::is.defined()) return this;
  if (this::is.error()) return this;
  if (this::is.string()) return new Error(this);
  if (this::is.dict()) return new Error(JSON.stringify(this));
  return new Error(this.toString());
}

/**
 * Converts this object into an array of errors.  The resulting array will have this error as the
 * first element, followed by all nested `innerError` instances discovered.
 * 
 * @export
 * @this {*} This object.
 * @returns {Error[]}
 */
export function toArray() {
  const errors = [];
  this::foreach(error => errors.push(error));
  return errors;
}

/**
 * Traverses this error, including each `innerError`, and applies the given function.
 *
 * @export
 * @this {Error} This error.
 * @param {ForEachFunction} fn The function to be applied to each error.
 * @throws When `fn` is not a function.
 */
export function foreach(fn) {
  const originalError = this::asError();

  if (!fn::is.func())
    throw new BadArgumentError("must be a function", "fn", fn);

  let error = originalError;
  let depth = 0;
  while (error != null) {
    fn(error, depth, originalError);
    error = error.innerError::asError();
    depth = depth + 1;
  }
}

/**
 * Traverses this error, including each `innerError`, and transforms each one with the given `transformationFn`.
 *
 * @export
 * @template T
 * @this {Error} This error.
 * @param {TransformationFunction<T>} transformationFn The transformation function.
 * @returns {T[]} The transformed results.
 * @throws When `transformationFn` is not a function.
 */
export function map(transformationFn) {
  const originalError = this::asError();

  if (!transformationFn::is.func())
    throw new BadArgumentError("must be a function", "transformationFn", transformationFn);
  
  const mappedElements = [];

  let error = originalError;
  let depth = 0;
  while (error != null) {
    const result = transformationFn(error, depth, originalError);
    mappedElements.push(result);
    error = error.innerError::asError();
    depth = depth + 1;
  }

  return mappedElements;
}

/**
 * Traverses this error, including each `innerError`, and applies the given partial-function to each,
 * discarding any result that is `undefined`.
 *
 * @export
 * @template T
 * @this {Error} This error.
 * @param {PartialFunction<T>} partialFn The partial function.
 * @returns {T[]} The collected results.
 * @throws When `partialFn` is not a function.
 */
export function collect(partialFn) {
  const originalError = this::asError();

  if (!partialFn::is.func())
    throw new BadArgumentError("must be a function", "partialFn", partialFn);
  
  const collectedElements = [];

  let error = originalError;
  let depth = 0;
  while (error != null) {
    const result = partialFn(error, depth, originalError);
    if (!result::is.undefined())
      collectedElements.push(result);
    error = error.innerError::asError();
    depth = depth + 1;
  }

  return collectedElements;
}

/**
 * @callback ForEachFunction
 * @param {Error} error The current error.
 * @param {number} depth The depth traversed so far.
 * @param {Error} originalError The original error being traversed.
 * @returns {void}
 */

/**
 * @template T
 * @callback TransformationFunction
 * @param {Error} error The current error.
 * @param {number} depth The depth traversed so far.
 * @param {Error} originalError The original error being traversed.
 * @returns {T} A new value.
 */

/**
 * @template T
 * @callback PartialFunction
 * @param {Error} error The current error.
 * @param {number} depth The depth traversed so far.
 * @param {Error} originalError The original error being traversed.
 * @returns {T|void} A new value or `undefined` in the case the function could not be applied to the error.
 */