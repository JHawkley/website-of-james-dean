import { reduceWhile } from "tools/extensions/array";
import { backtrack, isUndefined, isResult } from "./helpers";
import { takeUntil, map, expect, flatten } from "./modifiers";

/**
 * Creates a parser that will use a map-of-parsers to generate a map-of-parser-results.  The parsers are
 * evaluated in the insertion order of the map.
 *
 * @export
 * @template K, V
 * @param {Map<K,Parser<V>>} mapOfParsers A map of parsers.
 * @returns {BacktrackingParser<Map<K,V>>} A parser that results in a map of parsing results.
 */
export const toMap = (mapOfParsers) => backtrack((state) => {
  const result = new Map();
  for (const { key, parser } of mapOfParsers) {
    const value = parser(state);
    if (isUndefined(value)) return void 0;
    result.set(key, value);
  }
  return result;
});

/**
 * Creates a parser that will try to apply all the given parsers and produce an array of their results.
 *
 * @export
 * @template T
 * @param {...Parser<T>} parsers The parsers to run in sequence.
 * @returns {BacktrackingParser<T[]>} A parser that results in an array of parsing results.
 */
export const seq = (...parsers) => arr(parsers);

/**
 * Creates a parser that will try to map the given array of parsers to their results.  The parser will fail if any
 * parser in the array fails.
 *
 * @export
 * @template T
 * @param {Parser<T>[]} parsers The array of parsers.
 * @returns {BacktrackingParser<T[]>} A parser that results in an array of parsing results.
 */
export const arr = (parsers) => backtrack((state) => {
  const result = parsers::reduceWhile([], isResult, (arr, parser) => {
    const value = parser(state);
    if (isUndefined(value)) return void 0;
    arr.push(value);
    return arr;
  });
  return result;
});

/**
 * Creates a parser that will concatenate the results of `rest` to the result of `lead`.  If `lead` is not an array
 * it will be wrapped in one before the concatenation begins.
 *
 * @export
 * @template T
 * @param {Parser<T|T[]>} lead The parser whose result will be the leading value(s) of the output array.
 * @param {...Parser<T>} rest The other parsers to be concatenated.
 * @returns {ConcatParser<T[]>} A parser producing an array.
 */
export const concat = (lead, ...rest) => {
  const trueLead = lead._concatLead ?? lead; 
  const concatRest = typeof lead._concatRest === "undefined" ? rest : [...lead._concatRest, ...rest];

  const concatParser = flatten(seq(trueLead, arr(concatRest)));
  concatParser._concatLead = trueLead;
  concatParser._concatRest = concatRest;

  return concatParser;
};

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
    if (isResult(position)) return result;
    state.position = position;
  }
  return void 0;
};

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
  const safeContents = expect(takeUntil(contents, closing), expectMsg ?? "found `opening` but did not find `closing`");
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

/**
 * A parser created by the `concat` combinator.  When `concat` is chained, the function will recognize this and
 * optimize the result parser.
 * 
 * @typedef {BacktrackingParser<T[]>} ConcatParser
 * @template T
 * @property {Parser<T|T[]>} _concatLead The parser that produces the first element(s).
 * @property {Parser<T>[]} _concatRest An array of parsers that this parser will concatenate to the leading element(s).
 */