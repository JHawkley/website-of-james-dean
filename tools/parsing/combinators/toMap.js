import { backtrack } from "../modifiers/backtrack";
import { isUndefined } from "../helpers/isUndefined";

/**
 * Creates a parser that will use a map-of-parsers to generate a map-of-parser-results.  The parsers are
 * evaluated in the insertion order of the map.
 *
 * @export
 * @template K, V
 * @param {Map<K,Parser<V>>} mapOfParsers A map of parsers.
 * @returns {BacktrackingParser<Map<K,V>>} A parser that results in a map of parsing results.
 */
export const toMap = (mapOfParsers) => backtrack((state) => {
  const result = new Map();
  for (const { key, parser } of mapOfParsers) {
    const value = parser(state);
    if (isUndefined(value)) return void 0;
    result.set(key, value);
  }
  return result;
});