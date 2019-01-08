import { isUndefined } from "../helpers/isUndefined";
import { backtrack } from "./backtrack";
import { join } from "./join";

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
 * @template T
 * @callback PredicateFunction
 * @param {T} value The value that was just parsed.
 * @param {T[]} results The array containing the parser's current results.
 * @param {ParserState} state The state of the parser.
 * @returns {boolean} Whether the `value` passes the predicate.
 */