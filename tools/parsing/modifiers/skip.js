import { emptyResult } from "../core/emptyResult";
import { isUndefined } from "../helpers/isUndefined";

/**
 * Creates a parser that will apply the given parser and convert a successful match into an empty-result.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser whose result to make into the empty-result.
 * @returns {BacktrackingParser<T>}
 */
export const skip = (parser) => (state) => {
  const result = parser(state);
  return isUndefined(result) ? void 0 : emptyResult;
}