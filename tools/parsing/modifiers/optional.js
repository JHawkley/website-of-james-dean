import { emptyResult } from "../core/emptyResult";

/**
 * Creates a parser that will apply the given parser and convert a failed match into an empty-result.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to make optional.
 * @returns {Parser<T>}
 */
export const optional = (parser) => (state) => parser(state) ?? emptyResult;