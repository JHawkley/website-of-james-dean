import { emptyResult } from "../core/emptyResult";

/** 
 * A parser that will match the end-of-input.  It produces an empty-result on match.
 * 
 * @type {Parser<emptyResult>}
 */
export const endOfInput = ({input, position}) => {
  return position >= input.length ? emptyResult : void 0;
};