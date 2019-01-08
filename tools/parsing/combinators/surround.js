import { map } from "../modifiers/map";
import { expect } from "../modifiers/expect";
import { seq } from "./seq";

/**
 * Creates a parser that matches a bit of content surrounded by something that indicates a contextual block,
 * such as open-parenthesis and closing-parenthesis.  If the `opening` is matched, an error will be thrown if
 * the `closing` is not also matched.
 * 
 * For a version of this that produces the content without the opening and closing matches, use `surround.contentOnly`.
 *
 * @export
 * @template O,T,C
 * @param {Parser<O>} opening The parser matches the opening of the content.
 * @param {Parser<T>} contents The parsers that matches the content.
 * @param {Parser<C>} closing The parser matches the closing of the content.
 * @param {string} [expectMsg] A message to use in the error thrown if the contents never terminates with `closing`.
 * @returns {Parser<[O, T, C]>} A parser that results in a 3-element array.
 * @throws When `opening` was found but `closing` was not.
 */
export const surround = (opening, contents, closing, expectMsg) => {
  const safeClosing = expect(closing, expectMsg ?? "found `opening` but did not find `closing`");
  return seq(opening, contents, safeClosing);
};

/**
 * Creates a parser that matches a bit of content surrounded by something that indicates a contextual block,
 * such as open-parenthesis and closing-parenthesis.  If the `opening` is matched, an error will be thrown if
 * the `closing` is not also matched.  This combinator's parser returns only the contents.
 *
 * @export
 * @template O,T,C
 * @param {Parser<O>} opening The parser matches the opening of the content.
 * @param {Parser<T>} contents The parsers that matches the content.
 * @param {Parser<C>} closing The parser matches the closing of the content.
 * @param {string} [expectMsg] A message to use in the error thrown if the contents never terminates with `closing`.
 * @returns {Parser<T>} A parser that results in the matched contents.
 * @throws When `opening` was found but `closing` was not.
 */
surround.contentOnly = (opening, contents, closing, expectMsg) => {
  return map(surround(opening, contents, closing, expectMsg), (result) => result[1]);
};