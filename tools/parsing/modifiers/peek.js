import { backtrack } from "./backtrack";

/**
 * Creates a parser that will apply the given parser, then backtrack and return its result.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to peek with.
 * @returns {BacktrackingParser<T>}
 */
export const peek = (parser) => backtrack.mark((state) => {
  const { position } = state;
  const result = parser(state);
  state.position = position;
  return result;
});