import { map } from "../modifiers/map";
import { expect } from "../modifiers/expect";
import { seq } from "./seq";
import { interpose } from "./interpose";

/**
 * Creates a parser that matches a bit of content surrounded by something that indicates a contextual block,
 * such as open-parenthesis and closing-parenthesis.  The content parser will be executed until the `closing`
 * matches.  If the `opening` is matched, an error will be thrown if the `closing` is not also matched.
 * 
 * For a version of this that produces the content without the opening and closing matches, use `scope.contentOnly`.
 *
 * @export
 * @template O,T,C
 * @param {Parser<O>} opening The parser matches the opening of the content.
 * @param {Parser<T>} contents The parsers that matches the content.
 * @param {Parser<C>} closing The parser matches the closing of the content.
 * @param {string} [expectMsg] A message to use in the error thrown if the contents never terminates with `closing`.
 * @returns {Parser<[O, T[], C]>} A parser that results in 3-element array.
 * @throws When `opening` was found but `closing` was not.
 */
export const scope = (opening, contents, closing, expectMsg) => {
  const safeContents = expect(interpose(contents, closing), expectMsg ?? "found `opening` but did not find `closing`");
  return seq(opening, safeContents, closing);
};

/**
 * Creates a parser that matches a bit of content surrounded by something that indicates a contextual block,
 * such as open-parenthesis and closing-parenthesis.  The content parser will be executed until the `closing`
 * finally matches.  If the `opening` is matched, an error will be thrown if the `closing` is not also matched.
 * This combinator's parser returns only the contents.
 *
 * @export
 * @template O,T,C
 * @param {Parser<O>} opening The parser matches the opening of the content.
 * @param {Parser<T>} contents The parsers that matches the content.
 * @param {Parser<C>} closing The parser matches the closing of the content.
 * @param {string} [expectMsg] A message to use in the error thrown if the contents never terminates with `closing`.
 * @returns {Parser<T[]>} A parser that results in the matched contents.
 * @throws When `opening` was found but `closing` was not.
 */
scope.contentOnly = (opening, contents, closing, expectMsg) => {
  return map(scope(opening, contents, closing, expectMsg), (result) => result[1]);
};