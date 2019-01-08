import { flattenBy as modFlattenBy } from "../modifiers/flattenBy";

/**
 * Flattens the result array of this parser by some number of `levels`.
 *
 * @export
 * @this {Parser<Array}
 * @param {number} levels The number of levels to flatten by.
 * @returns {Parser<Array>} A parser that produces an array.
 */
export function flattenBy(levels) {
  return modFlattenBy(this, levels);
}