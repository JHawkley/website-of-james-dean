import { emptyResult } from "../core/emptyResult";

/** 
 * A parser that will match the start-of-input.  It produces an empty-result on match.
 * 
 * @type {Parser<emptyResult>}
 */
export const startOfInput = ({position}) => {
  return position === 0 ? emptyResult : void 0;
};