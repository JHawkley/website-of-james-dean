import { isResult } from "../helpers/isResult";

/**
 * Creates a parser that will return the result of the first parser that successfully matches.  The `parsers`
 * are attempted in the order given.
 *
 * @export
 * @template T
 * @param {...Parser<T>} parsers The parsers to run.
 * @returns {BacktrackingParser<T>} A parser that provides the first result of the first parser to succeed.
 */
export const oneOf = (...parsers) => (state) => {
  const { position } = state;
  for (const parser of parsers) {
    const result = parser(state);
    if (isResult(result)) return result;
    state.position = position;
  }
  return void 0;
};