import * as arrEx from "tools/extensions/array";
import * as premade from "./parsers";
import { isUndefined, isResult, isEmpty, globalizedRegExpData } from "./helpers";
import { backtrack, map, expect, join, peek, stringToArray } from "./modifiers";
import { emptyResult } from "./core";

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
  const result = parsers::arrEx.reduceWhile([], isResult, (arr, parser) => {
    const value = parser(state);
    if (isUndefined(value)) return void 0;
    arr.push(value);
    return arr;
  });
  return result;
});

/**
 * Creates a parser that will perform array-concatenation, concatenating the results of `rest` to the result
 * of `lead`.  If `lead` is not an array it will be wrapped in one before the concatenation begins.
 *
 * @export
 * @template T
 * @param {Parser<T|T[]>} lead The parser whose result will be the leading value(s) of the output array.
 * @param {...Parser<T>} rest The other parsers to be concatenated.
 * @returns {ArrayConcatParser<T[]>} A parser producing an array.
 */
export const concat = (lead, ...rest) => {
  const trueLead = lead._arrConcatLead ?? lead;
  const concatRest = isUndefined(lead._arrConcatRest) ? rest : [...lead._arrConcatRest, ...rest];

  const concatParser = backtrack((state) => {
    const leadResult = trueLead(state);
    const result = Array.isArray(leadResult) ? leadResult : [leadResult];
    for (let i = 0, len = concatRest.length; i < len; i++) {
      const restResult = concatRest[i](state);
      if (isUndefined(restResult)) return void 0;
      result.push(restResult);
    }
    return result;
  });
  concatParser._arrConcatLead = trueLead;
  concatParser._arrConcatRest = concatRest;

  return concatParser;
};

/**
 * Creates a parser that will perform array-concatenation, concatenating the results of `rest` to the result
 * of `lead`.  If `lead` is not an array it will be wrapped in one before the concatenation begins.
 *
 * @export
 * @template T
 * @param {Parser<T|T[]>} lead The parser whose result will be the leading value(s) of the output array.
 * @param {...Parser<T>} rest The other parsers to be concatenated.
 * @returns {ArrayConcatParser<T[]>} A parser producing an array.
 */
concat.array = concat;

/**
 * Creates a parser that will perform string-concatenation, concatenating the result of `rest` to the result
 * of `lead`.
 *
 * @export
 * @template T
 * @param {Parser<Stringable>} lead The parser whose result will be the start of the output string.
 * @param {...Parser<Stringable>} rest The other parsers to be concatenated.
 * @returns {StringConcatParser<string>} A parser producing a string.
 */
concat.string = (lead, ...rest) => {
  const trueLead = lead._strConcatLead ?? lead; 
  const concatRest = isUndefined(lead._strConcatRest) ? rest : [...lead._strConcatRest, ...rest];

  const concatParser = backtrack(join(arr([trueLead, ...concatRest])));
  concatParser._strConcatLead = trueLead;
  concatParser._strConcatRest = concatRest;

  return concatParser;
};

/**
 * Creates a parser that will apply the given parser and accumulate valid results, until `ending` successfully
 * matches something, then returns those results as an array.  If `parser` fails before the `ending` is located,
 * the parser will fail.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to accumulate results from.
 * @param {Parser} ending The parser that will signal the end.
 * @returns {BacktrackingParser<T[]>} A parser that produces the accumulated results of `parser`.
 */
export const interpose = (parser, ending) => {
  const fastPath = interpose_tryFastPath(parser, ending);
  if (fastPath) return stringToArray(fastPath);

  const peekForEnding = peek(ending);
  return backtrack((state) => {
    const result = [];
    while (isUndefined(peekForEnding(state))) {
      const value = parser(state);
      if (isUndefined(value)) return void 0;
      result.push(value);
    }
    return result;
  });
};

/**
 * Creates a parser that will apply the given parser and accumulate valid results, until `ending` successfully
 * matches something, then returns those results as an array.  If `parser` fails before the `ending` is located,
 * the parser will fail.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to accumulate results from.
 * @param {Parser} ending The parser that will signal the end.
 * @returns {BacktrackingParser<T[]>} A parser that produces the accumulated results of `parser`.
 */
interpose.array = interpose;

/**
 * Creates a parser that will apply the given parser and accumulate valid results, until `ending` successfully
 * matches something, then joins those results into a string and returns it.  If `parser` fails before the
 * `ending` is located, the parser will fail.
 *
 * @export
 * @template T
 * @param {Parser<Stringable>} parser The parser to accumulate results from.
 * @param {Parser<T>} ending The parser that will signal the end.
 * @returns {BacktrackingParser<string>} A parser that produces the accumulated results of `parser`.
 */
interpose.string = (parser, ending) =>
  interpose_tryFastPath(parser, ending) ?? join.all(interpose(parser, ending), "");

const interpose_tryFastPath = (parser, ending) => {
  // There are a few fast-paths we can take if we're using the `any` parser.
  if (parser === premade.any) {
    if (ending === premade.endOfInput)
      return premade.rest;
    if (ending.parserSource) {
      if (typeof ending.parserSource === "string")
        return interpose_fastPath_string(ending.parserSource);
      else if (ending.parserSource instanceof RegExp)
        return interpose_fastPath_regex(ending.parserSource);
    }
  }
  return void 0;
}

const interpose_fastPath_string = (pattern) => backtrack.mark((state) => {
  const { position, input } = state;
  const indexOfStr = input.indexOf(pattern, position);
  if (indexOfStr === -1) return void 0;
  state.position = indexOfStr;
  return input.substring(position, indexOfStr);
});

const interpose_fastPath_regex = backtrack.mark((pattern) => {
  const rgx = new RegExp(...globalizedRegExpData(pattern));

  return backtrack.mark((state) => {
    const { position, input } = state;
    rgx.lastIndex = position;
    const indexOfMatch = input.search(rgx);
    if (indexOfMatch === -1) return void 0;
    state.position = indexOfMatch;
    return input.substring(position, indexOfMatch);
  });
});

/**
 * Creates a parser that will apply as many of the given parsers to the input as possible and return their results
 * in an array.  The parsers are applied in the given order, and any that fail to match will have an empty-result
 * in their position.
 * 
 * For a version that will fail if none of the parsers match, use `anyOf.required` instead.
 *
 * @export
 * @template T
 * @param {...Parser<T>} parsers An array of parsers to attempt to apply to the input.
 * @returns {Parser<T[]>} A parser producing an array.
 */
export const anyOf = (...parsers) => {
  const backtrackingParsers = parsers.map(backtrack);
  return (state) => {
    return backtrackingParsers.map((parser) => {
      const parserResult = parser(state);
      return isResult(parserResult) ? parserResult : emptyResult;
    });
  };
};

/**
 * Creates a parser that will apply as many of the given parsers to the input as possible and return their results
 * in an array.  The parsers are applied in the given order, and any that fail to match will have an empty-result
 * in their position.
 * 
 * If none of the given parsers match, the whole parser will fail.
 *
 * @export
 * @template T
 * @param {...Parser<T>} parsers An array of parsers to attempt to apply to the input.
 * @returns {BacktrackingParser<T[]>} A parser producing an array.
 */
anyOf.required = (...parsers) => backtrack(map(anyOf(...parsers), (result) => result.every(isEmpty) ? void 0 : result));

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

/**
 * A parser created by the `concat` combinator.  When `concat` is chained, the function will recognize this and
 * optimize the result parser.
 * 
 * @typedef {BacktrackingParser<T[]>} ArrayConcatParser
 * @template T
 * @property {Parser<T|T[]>} _concatLead
 *   The parser that produces the first element(s).
 * @property {Parser<T>[]} _concatRest
 *   An array of parsers that this parser will concatenate to the leading element(s).
 */

/**
 * A parser created by the `concat.string` combinator.  When `concat.string` is chained, the function will recognize
 * this and optimize the result parser.
 * 
 * @typedef {BacktrackingParser<string>} StringConcatParser
 * @property {Parser<Stringable>} _concatLead
 *   The parser that produces the first element(s).
 * @property {Parser<Stringable>[]} _concatRest
 *   An array of parsers that this parser will concatenate to the leading element(s).
 */