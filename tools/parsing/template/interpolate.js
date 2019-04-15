import { isUndefined } from "../helpers/isUndefined";

/**
 * When used in a placeholder of a template-literal tagged with `parse`, it will convert to a parser that will
 * parse any character until the immediate next string-fragment or parser matches.  If `interpolate` is applied
 * with a parser, then it will repeatedly apply the parser and accumulate the results into an array until the
 * given parser matches.
 * 
 * It is not necessary to call this function when using it in a placeholder.
 * 
 * @export
 * @param {Parser<T>} [parser] The parser to use during interpolation.
 * @returns {AppliedInterpolation} A class storing the parser and identifying it as an interpolation.
 */
export const interpolate = (parser) => {
  if (isUndefined(parser)) return interpolate;
  return new AppliedInterpolation(parser);
}

export class AppliedInterpolation {
  constructor(parser) { this.parser = parser; Object.freeze(this); }
}