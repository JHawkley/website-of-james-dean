import { copyOwn } from "tools/extensions/common";

/**
 * Represents the empty-result.
 *
 * @export
 * @param {*} v The value to test.
 * @returns {boolean}
 */
export const emptyResult = null;

export class ParsingError extends Error {
  constructor(state, message) {
    super(message);
    this.parserPosition = state.position + state.nestedOffset;
    this.parserState = state::copyOwn();
  }
}

/**
 * Runs the given `parser` on the given `input` string.
 * 
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to run.
 * @param {string} input The string to parse.
 * @param {number} [nestedOffset=0]
 *   A value to add to the state's `position` on errors.  This is intended to be used by the `refine`
 *   modifier on nested parsing runs.
 * @returns {T} The result of parsing `input`.
 */
export const run = (parser, input, nestedOffset = 0) => {
  const state = { position: 0, nestedOffset, input };
  return parser(state);
};