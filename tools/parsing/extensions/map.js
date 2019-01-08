import { map as modMap } from "../modifiers/map";

/**
 * Modifies this parser by mapping its result using the given `transformationFn`.
 *
 * @export
 * @template T, U
 * @this {Parser<T>}
 * @param {function(T): U} transformationFn The function to transform this parser's result.
 * @returns {Parser<U>}
 */
export function map(transformationFn) {
  return modMap(this, transformationFn);
}