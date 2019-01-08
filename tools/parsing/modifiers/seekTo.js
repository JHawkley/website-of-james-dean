import { isUndefined } from "../helpers/isUndefined";
import { isResult } from "../helpers/isResult";
import { globalizedRegExpData } from "../helpers/globalizedRegExpData";
import { regex } from "../atomic/regex";
import { backtrack } from "./backtrack";

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