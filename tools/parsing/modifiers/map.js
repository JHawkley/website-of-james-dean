import { isUndefined } from "../helpers/isUndefined";

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
 * @template T,U
 * @callback TransformationFunction
 * @param {T} value The value that was just parsed.
 * @param {ParserState} state The state of the parser.
 * @returns {U} The transformed value.
 */