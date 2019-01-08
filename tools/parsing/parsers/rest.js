import { emptyResult } from "../core/emptyResult";

/**
 * A parser that will match all remaining characters of the input.  If the parser is already at the end of the input,
 * an empty-value will be returned instead.
 *
 * @type {Parser<string>}
 */
export const rest = (state) => {
  const { input, position } = state;
  if (position >= input.length) return emptyResult;
  state.position = input.length;
  return input.substring(position);
};