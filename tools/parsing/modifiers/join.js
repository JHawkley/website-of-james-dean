import { isUndefined } from "../helpers/isUndefined";
import { resultToString } from "../helpers/resultToString";
import { isStringable } from "../helpers/isStringable";
import { ParsingError } from "../core/parsingError";
import { map } from "./map";

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
 * Represents a mixture of stringable and non-stringable types.
 * 
 * @typedef {T|Stringable} Mixed
 * @template T
 */