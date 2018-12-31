import * as arrEx from "tools/extensions/array";
import * as premade from "./parsers";
import { regex } from "./atomic";
import { emptyResult, ParsingError, run } from "./core";
import { isUndefined, isResult, isEmpty } from "./helpers";
import { isStringable, resultToString, globalizedRegExpData, isRegExpExecArray } from "./helpers";

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

/**
 * Creates a parser that will backtrack on any thrown errors while executing the given parser.
 * Note that this parser is not itself a backtracking-parser.  If `parser` results with `undefined`,
 * this parser will not backtrack and will simply produce the result.
 * 
 * If `handler` is provided, any thrown error will be passed to it as an argument.  If the handler returns
 * `true`, the parser's result will become `undefined`.  If it returns anything else, the error will be
 * re-thrown.  Use this to filter the error-boundary to catch specific errors.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @param {function(*): boolean} [handler] A function to test the error.
 * @returns {Parser<T>}
 */
export const errorBoundary = (parser, handler) => (state) => {
  const { position } = state;
  try {
    return parser(state);
  }
  catch (error) {
    if (!handler || handler(error) === true) {
      state.position = position;
      return void 0;
    }
    throw error;
  }
};

/**
 * Creates a parser that will throw an error with the given `message` if the given parser fails to match,
 * or otherwise return its value.
 * 
 * This version throws a basic `ParserError`.  To throw a custom error type, use `expect.custom`.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @param {string} [message] The message to give to the thrown `ParsingError`.
 * @returns {Parser<T>}
 */
export const expect = (parser, message = "expected parser to succeed") => (state) => {
  const value = parser(state);
  if (isResult(value)) return value;
  throw new ParsingError(state, message);
};

/**
 * Creates a parser that will throw a custom error if the given parser fails to match, or otherwise return
 * its value.  The return value from `errorFactory` will be immediately thrown, no matter what that value
 * happens to be.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @param {function(ParserState): Error} errorFactory A factory creating a custom error.
 * @returns {Parser<T>}
 */
expect.custom = (parser, errorFactory) => (state) => {
  const value = parser(state);
  if (isResult(value)) return value;
  throw errorFactory(state);
}

/**
 * Creates a parser that will throw a custom error if the given parser matches successfully, or otherwise
 * returns `undefined`.
 * 
 * This version throws a basic `ParserError`.  To throw a custom error type, use `neverExpect.custom`.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @param {string} [message] The message to give to the thrown `ParsingError`.
 * @returns {Parser<T>}
 */
export const neverExpect = (parser, message = "expected parser to fail") => (state) => {
  if (isUndefined(parser(state))) return void 0;
  throw new ParsingError(state, message);
};

/**
 * Creates a parser that will throw an error if the given parser matches successfully, or otherwise return its
 * `undefined`. The return value from `errorFactory` will be immediately thrown, no matter what that value happens
 * to be.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @param {function(ParserState): Error} errorFactory A factory creating a custom error.
 * @returns {Parser<T>}
 */
neverExpect.custom = (parser, errorFactory) => (state) => {
  if (isUndefined(parser(state))) return void 0;
  throw errorFactory(state);
};

/**
 * Creates a parser that will convert the given parser's result from something stringable to an array of characters.
 * 
 * @export
 * @template T
 * @param {Parser<Stringable>} parser The parser to wrap.
 * @returns {Parser<string[]>} A parser.
 */
export const stringToArray = (parser) => map(asString(parser), (str) => [...str]);

/**
 * Creates a parser that will search the input until the given parser matches.
 * 
 * This can be an expensive process, as the parser will be tested on each character until a match is found or
 * the entire string was searched.  However, there are fast-paths if the `parser` was created by the `str` or
 * `regex` atomic parser factories.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to use in the search.
 * @returns {BacktrackingParser<T>}
 */
export const seekTo = (parser) => {
  const fastPath = seekTo_tryFastPath(parser);
  if (fastPath) return fastPath;

  return backtrack.mark((state) => {
    const { position, input } = state;
    let result = void 0;
    let offset = position;
    while (state.position < input.length && isUndefined(result)) {
      state.position = offset;
      offset += 1;
      result = parser(state);
    }
    if (isResult(result)) return result;
    state.position = position;
    return void 0;
  });
};

const seekTo_tryFastPath = (parser) => {
  if (parser.parserSource) {
    if (typeof parser.parserSource === "string")
      return seekTo_fastPath_string(parser.parserSource);
    else if (parser.parserSource instanceof RegExp)
      return seekTo_fastPath_regex(parser.parserSource);
  }
  return void 0;
}

const seekTo_fastPath_string = (pattern) => backtrack.mark((state) => {
  const { position, input } = state;
  const indexOfStr = input.indexOf(pattern, position);
  if (indexOfStr === -1) return void 0;
  state.position = indexOfStr + pattern.length;
  return pattern;
});

const seekTo_fastPath_regex = (pattern) => regex(...globalizedRegExpData(pattern));

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

/**
 * Creates a parser that will apply the given parser and convert a failed match into an empty-result.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to make optional.
 * @returns {Parser<T>}
 */
export const optional = (parser) => (state) => parser(state) ?? emptyResult;

/**
 * Creates a parser that will apply the given parser and convert a successful match into an empty-result.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser whose result to make into the empty-result.
 * @returns {BacktrackingParser<T>}
 */
export const skip = (parser) => (state) => {
  const result = parser(state);
  return isUndefined(result) ? void 0 : emptyResult;
}

/**
 * Creates a parser that removes empty-results from the given parser's result.  If the result is not an array,
 * it will be wrapped in one.
 * 
 * This modifier will return an empty array in the case all the results were empty.  For a more-strict version
 * that expects at least one result to remain, use `filterEmpty.required`.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser whose result to be filtered.
 * @returns {Parser<T[]>} A parser that produces an array containing the results.
 */
export const filterEmpty = (parser) => map(parser, (parserResult) => {
  if (isEmpty(parserResult)) return [];
  if (!Array.isArray(parserResult)) return [parserResult];
  return parserResult::arrEx.reject(isEmpty);
});

/**
 * Creates a parser that removes empty-results from the given parser's result.  If the result is not an array,
 * it will be wrapped in one.
 * 
 * This version expects that at least one result will remain after filtering.  If not, the parser will consider
 * it a failure.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser whose result to be filtered.
 * @returns {Parser<T[]>} A parser that produces an array containing the results.
 */
filterEmpty.required = (parser) => map(parser, (parserResult) => {
  if (isEmpty(parserResult)) return void 0;
  if (!Array.isArray(parserResult)) return [parserResult];
  const result = parserResult::arrEx.reject(isEmpty);
  if (result.length === 0) return void 0;
  return result;
});

/**
 * Creates a parser that will apply the given parser and then, if it succeeds, apply the given `transformationFn`
 * to its result and produce that as its result.
 *
 * @export
 * @template T,U
 * @param {Parser<T>} parser The parser whose result to transform.
 * @param {TransformationFunction<T, U>} transformationFn The transformation function.
 * @returns {Parser<U>}
 */
export const map = (parser, transformationFn) => {
  if (typeof transformationFn !== "function")
    throw new Error(`expected \`transformationFn\` to be a function; got \`${transformationFn}\` instead.`);
  return (state) => {
    const value = parser(state);
    if (isUndefined(value)) return void 0;
    return transformationFn(value, state);
  };
}

/**
 * Creates a parser that will apply the given parser until it fails, accumulating valid results, then returns
 * those results as an array.  If the given parser never matched, the array will be empty.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to accumulate results from.
 * @returns {Parser<T[]>} A parser that produces the accumulated results of `parser`.
 */
export const takeWhile = (parser) => parser === premade.any ? stringToArray(premade.rest) : (state) => {
  const result = [];
  let value = parser(state);
  while(isResult(value)) {
    result.push(value);
    value = parser(state);
  }
  return result;
};

/**
 * Creates a parser that will apply the given parser until it fails, joining the results into a string
 * and returning it.  If the given parser never matched, the string will be empty.
 *
 * @export
 * @param {Parser<Stringable>} parser The parser to accumulate results from.
 * @returns {Parser<string>} A parser that produces the accumulated results of `parser`.
 */
takeWhile.string = (parser) => parser === premade.any ? premade.rest : join.all(takeWhile(parser), "");

/**
 * Creates a parser that will apply the given parser and accumulate valid results, until the given `predicateFn`
 * returns `false` or the end of the input is reached, then returns those results as an array.  If `parser` fails
 * before the ending condition is reached, the parser will fail.
 *
 * @export
 * @template T,U
 * @param {Parser<T>} parser The parser to accumulate results from.
 * @param {PredicateFunction<T>} predicateFn The predicate function.
 * @returns {BacktrackingParser<T[]>} A parser that produces the accumulated results of `parser`.
 */
export const takeUntil = (parser, predicateFn) => {
  return backtrack((state) => {
    const { inputLength } = state.input;
    const result = [];
    while (state.position < inputLength) {
      const value = parser(state);
      if (isUndefined(value)) return void 0;
      if (!predicateFn(value, result, state)) return result;
      result.push(value);
    }
    return result;
  });
};

/**
 * Creates a parser that will apply the given parser and accumulate valid results, until the given `predicateFn`
 * returns `false` or the end of the input is reached, then joins those results into a string and returns it.
 * If `parser` fails before the ending condition is reached, the parser will fail.
 *
 * @export
 * @template T
 * @param {Parser<Stringable>} parser The parser to accumulate results from.
 * @param {PredicateFunction<T>} predicateFn The predicate function.
 * @returns {BacktrackingParser<string>} A parser that produces the accumulated results of `parser`.
 */
takeUntil.string = (parser, predicateFn) => join.all(takeUntil(parser, predicateFn), "");

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

/**
 * Creates a parser that will apply the given parser and convert its stringable result to a string.  Will return
 * `undefined` if the result was not stringable.  Handy for converting the results of the `regex` parser into a
 * proper string.
 * 
 * For a less-strict version, use `asString.force`.
 *
 * @export
 * @template T
 * @param {Parser<Stringable>} parser The parser to convert to a string.
 * @returns {Parser<string>} A parser that produces a string.
 */
export const asString = (parser) => map(parser, resultToString);

/**
 * Creates a parser that will apply the given parser and convert its result to a string.  If the result is not
 * stringable, it will use the object's `toString` method to convert it.
 *
 * @export
 * @template T
 * @param {Parser} parser The parser to convert to a string.
 * @returns {Parser<string>} A parser that produces a string.
 */
asString.force = (parser) => map(parser, resultToString.force);

/**
 * Creates a parser that will get the result at the indicated index of a regular-expression result.
 *
 * @export
 * @template T
 * @param {Parser<RegExpExecArray>} parser The parser that produces a regular-expression result.
 * @returns {Parser<string>} A parser that produces a string.
 * @throws When the result was not a `RegExpExecArray`.
 * @throws When there was no capture-group at the given index.
 */
export const regexIndex = (parser, index) => map(parser, (parserResult, state) => {
  if (!isRegExpExecArray(parserResult))
    throw new ParsingError(state, `expected a \`RegExpExecArray\` but got \`${parserResult}\` instead`);
  const group = parserResult[index];
  if (isUndefined(group))
    throw new ParsingError(state, `regular-expression result did not have a capture-group at index \`${index}\``);
  return group;
});

/**
 * Creates a parser that will apply the given parser, then convert the result to a string.  If the result is not
 * an array, it will be converted to a string representation and returned.  If the result is an array, every element
 * will be converted to a string representation, then joined into a single string.
 *
 * @export
 * @template T
 * @param {Parser<T|T[]>} parser The parser whose result to convert to a string.
 * @param {string} [separator=""] The separator to use to join the string.
 * @returns {Parser<string>} A parser that produces a string.
 */
export const join = (parser, separator = "") => map(parser, (parserResult) => {
  if (!Array.isArray(parserResult))
    return resultToString.force(parserResult);
  return parserResult.map(resultToString.force).join(separator);
});

/**
 * Creates a parser that will apply the given parser, then convert the result to a string.  If the result is not
 * an array, but is stringable, the result will be converted and returned.  If the result is an array and every
 * element in the array is stringable, the array will be joined into a string and that string returned.  Any
 * other result will throw an error.
 *
 * @export
 * @param {Parser<Stringable|Stringable[]>} parser The parser whose result to convert to a string.
 * @param {string} [separator=""] The separator to use to join the string.
 * @returns {Parser<string>} A parser that produces a string.
 * @throws When the result is not stringable and is not an array.
 * @throws When the result is an array, but contains an element that is not stringable.
 */
join.all = (parser, separator = "") => map(parser, (parserResult, state) => {
  if (isStringable(parserResult)) return resultToString(parserResult);
  if (!Array.isArray(parserResult))
    throw new ParsingError(state, "cannot join something that is not an array");
  const stringedArray = parserResult.map((v) => {
    const s = resultToString(v);
    if (isUndefined(s))
      throw new ParsingError(state, `cannot join parser result; \`${v}\` was not stringable`);
    return s;
  });
  return stringedArray.join(separator);
});

/**
 * Creates a parser that will apply the given parser, then reduce the result to an array that joins strings
 * that were adjacent to each other in the result, but passes non-stringable objects as-is.  If the result
 * is not an array, but is stringable, the result will be an array containing the converted result.  Otherwise,
 * the result will just be an array containing the given parser's result.
 *
 * @export
 * @template T
 * @param {Parser<Mixed<T>|Mixed<T>[]} parser The parser whose result will be transformed.
 * @param {string} [separator=""] The separator to use to join the string.
 * @returns {Parser<Array<T|string>>} A parser that produces an array of strings or non-stringable objects.
 */
join.adjacent = (parser, separator = "") => map(parser, (parserResult) => {
  if (isStringable(parserResult)) return [resultToString(parserResult)];
  if (!Array.isArray(parserResult)) return [parserResult];

  const length = parserResult.length;
  const result = [];
  let currentGroup = [];

  for (let i = 1; i < length; i++) {
    const value = parserResult[i];
    const asString = resultToString(value);
    if (typeof asString === "string")
      currentGroup.push(asString);
    else {
      if (currentGroup.length > 0) {
        result.push(currentGroup.join(separator));
        currentGroup = [];
      }
      result.push(value);
    }
  }

  if (currentGroup.length > 0)
    result.push(currentGroup.join(separator));

  return result;
});

/**
 * Flattens the result array of `parser` by one level.
 *
 * @export
 * @template T
 * @param {Parser<Array<T|T[]>> parser The parser whose result will be flattened.
 * @returns {Parser<T[]>} A parser that produces an array.
 */
export const flatten = (parser) => flattenBy(parser, 1);

/**
 * Flattens the result array of `parser` by some number of `levels`.
 *
 * @export
 * @param {Parser<Array} parser The parser whose result will be flattened.
 * @param {number} levels The number of levels to flatten by.
 * @returns {Parser<Array>} A parser that produces an array.
 */
export const flattenBy = (parser, levels) => map(parser, (parserResult) => {
  return parserResult::arrEx.flattenBy(levels);
});

/**
 * Creates a parser that will run `refinementParser` on the result of `parser` and return the result.
 * 
 * @export
 * @template T
 * @param {Parser<string>} parser
 * @param {Parser<T>} refinementParser
 * @returns {Parser<T>} A parser.
 */
export const refine = (parser, refinementParser) => (state) => {
  return run(refinementParser, parser(state), state.position + state.nestedOffset);
};

/** 
 * Represents a mixture of stringable and non-stringable types.
 * 
 * @typedef {T|Stringable} Mixed
 * @template T
 */

/**
 * @template T,U
 * @callback TransformationFunction
 * @param {T} value The value that was just parsed.
 * @param {ParserState} state The state of the parser.
 * @returns {U} The transformed value.
 */

/**
 * @template T
 * @callback PredicateFunction
 * @param {T} value The value that was just parsed.
 * @param {T[]} results The array containing the parser's current results.
 * @param {ParserState} state The state of the parser.
 * @returns {boolean} Whether the `value` passes the predicate.
 */