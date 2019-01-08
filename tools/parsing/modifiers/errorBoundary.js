/**
 * Creates a parser that will backtrack on any thrown errors while executing the given parser.
 * Note that this parser is not itself a backtracking-parser.  If `parser` results with `undefined`,
 * this parser will not backtrack and will simply produce the result.
 * 
 * If `handler` is provided, any thrown error will be passed to it as an argument.  If the handler returns
 * `true`, the parser's result will become `undefined`.  If it returns anything else, the error will be
 * re-thrown.  Use this to filter the error-boundary to catch specific errors.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @param {function(*): boolean} [handler] A function to test the error.
 * @returns {Parser<T>}
 */
export const errorBoundary = (parser, handler) => (state) => {
  const { position } = state;
  try {
    return parser(state);
  }
  catch (error) {
    if (!handler || handler(error) === true) {
      state.position = position;
      return void 0;
    }
    throw error;
  }
};