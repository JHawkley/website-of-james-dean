import { expect as modExpect } from "../modifiers/expect";

/**
 * Modifies this parser with the expectation that it will match successfully.  If it does not, an error will
 * be thrown with the given message.
 *
 * @export
 * @template T
 * @this {Parser<T>}
 * @param {string} [message]
 * @returns {Parser<T>}
 */
export function expect(message) {
  return modExpect(this, message);
}