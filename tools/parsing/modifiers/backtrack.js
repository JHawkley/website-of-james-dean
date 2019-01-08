import { isResult } from "../helpers/isResult";

/**
 * Wraps the parser such that it will backtrack when it fails.  If the parser is already known
 * to backtrack, it will just return the same parser.
 * 
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @returns {BacktrackingParser<T>} A parser that will backtrack.
 */
export const backtrack = (parser) => {
  if (parser._willBacktrackOnFailure === true) return parser;
  return backtrack.mark((state) => {
    const { position } = state;
    const result = parser(state);
    if (isResult(result)) return result;
    state.position = position;
    return void 0;
  });
}

/**
 * Marks the given parser as a backtracking-parser.
 * 
 * @template T
 * @param {Parser<T>} parser The parser to mark.
 * @returns {BacktrackingParser<T>} The same parser, marked as backtracking.
 */
backtrack.mark = (parser) => {
  parser._willBacktrackOnFailure = true;
  return parser;
};