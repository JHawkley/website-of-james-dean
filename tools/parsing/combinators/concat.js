import { backtrack } from "../modifiers/backtrack";
import { join } from "../modifiers/join";
import { isUndefined } from "../helpers/isUndefined";
import { arr } from "./arr";

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