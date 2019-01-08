import { emptyResult } from "../core/emptyResult";
import { tag } from "./tag";

/**
 * Creates a parser that will parse the exact, given string.
 *
 * @export
 * @param {string} pattern The string to parse.
 * @returns {Parser<string>}
 */
export const str = (pattern) => str_impl(pattern, pattern);

/**
 * Creates a parser that will parse the exact, given string, but return an empty-result instead of the string.
 *
 * @export
 * @param {string} pattern The string to parse.
 * @returns {Parser<emptyResult>}
 */
str.skip = (pattern) => str_impl(pattern, emptyResult);

const str_impl = (pattern, result) => {
  if (!pattern) throw new Error("an empty-string cannot be matched");

  return tag(pattern, (state) => {
    const { input, position } = state;
    if (!input.startsWith(pattern, position)) return void 0;
    state.position += pattern.length;
    return result;
  });
};