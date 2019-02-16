import BadBindingError from "lib/BadBindingError";
import BadArgumentError from "lib/BadArgumentError";
import { is } from "tools/extensions/common";

/**
 * Determines if this class inherits from `otherClass`.  If this class and the other class are the same
 * function, this will still return `true`.
 *
 * @export
 * @this {function} This class.
 * @param {function} otherClass The other class to test against.
 * @returns {boolean} Whether this class inherits from
 * @throws When `this` is not a function.
 * @throws When `otherClass` is not a function.
 */
export function inheritsFrom(otherClass) {
  if (!this::is.func())
    throw new BadBindingError("was not a function", this);
  if (!otherClass::is.func())
    throw new BadArgumentError("was not a function", "otherClass", otherClass);
  
  return this === otherClass || this.prototype instanceof otherClass;
}