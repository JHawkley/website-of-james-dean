import { neverExpect as modNeverExpect } from "../modifiers/neverExpect";

/**
 * Modifies this parser with the expectation that it will never match successfully.  If it does, an error will
 * be thrown with the given message.
 *
 * @export
 * @template T
 * @this {Parser<T>}
 * @param {string} [message]
 * @returns {Parser<T>}
 */
export function neverExpect(message) {
  return modNeverExpect(this, message);
}