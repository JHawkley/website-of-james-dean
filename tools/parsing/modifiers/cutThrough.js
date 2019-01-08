import { isUndefined } from "../helpers/isUndefined";
import { backtrack } from "./backtrack";

/**
 * Creates a parser that will generate a substring from the current position, through to the new position of
 * the parser after applying `parser`.  This is useful for grabbing all the text between the current position
 * and the end of a global regular-expression's match.
 * 
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to execute.
 * @returns {BacktrackingParser<string>} A parser that produces a string.
 */
export const cutThrough = (parser) => backtrack((state) => {
  const { position: positionBefore } = state;

  const value = parser(state);
  if (isUndefined(value)) return void 0;

  const { position: positionAfter, input } = state;

  if (positionBefore === positionAfter) return "";
  return input.substring(positionBefore, positionAfter);
});