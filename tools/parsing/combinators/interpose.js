import { backtrack } from "../modifiers/backtrack";
import { join } from "../modifiers/join";
import { stringToArray } from "../modifiers/stringToArray";
import { peek } from "../modifiers/peek";
import { isUndefined } from "../helpers/isUndefined";
import { globalizedRegExpData } from "../helpers/globalizedRegExpData";
import { any } from "../parsers/any";
import { endOfInput } from "../parsers/endOfInput";
import { rest } from "../parsers/rest";

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
  if (parser === any) {
    if (ending === endOfInput)
      return rest;
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