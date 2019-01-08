import { flattenBy as modFlattenBy } from "../modifiers/flattenBy";

/**
 * Flattens the result array of this parser by one level.
 *
 * @export
 * @template T
 * @this {Parser<Array<T|T[]>>}
 * @returns {Parser<T[]>} A parser that produces an array.
 */
export function flatten() {
  return modFlattenBy(this, 1);
}