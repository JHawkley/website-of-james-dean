import { isUndefined } from "../helpers/isUndefined";
import { isRegExpExecArray } from "../helpers/isRegExpExecArray";
import { ParsingError } from "../core/parsingError";
import { map } from "./map";

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