/**
 * A parser that will always result in the state object.
 * 
 * @param {ParserState} state The state of the parse.
 * @returns {ParserState}
 */
export const state = (state) => state;

/** 
 * A parser that will always produce the current position of parsing run.
 * 
 * @param {ParserState} state The state of the parse.
 * @returns {number} The current position of the parse.
 */
export const position = ({position}) => position;

/** 
 * A parser that will match any character.  This parser does not join Unicode code-points for characters on the
 * Unicode astral-plane, and will return each code-point separately.
 * 
 * @param {ParserState} state The state of the parse.
 * @returns {string} The next character.
 */
export const any = (state) => {
  const { input, position } = state;
  if (position >= input.length) return void 0;
  const char = input[position];
  state.position = position + 1;
  return char;
};

/** 
 * A parser that will match the start-of-input.  It produces an empty-value on match.
 * 
 * @param {ParserState} state The state of the parse.
 * @returns {null} The next character.
 */
export const startOfInput = ({position}) => {
  return position === 0 ? null : void 0;
}

/** 
 * A parser that will match the end-of-input.  It produces an empty-value on match.
 * 
 * @param {ParserState} state The state of the parse.
 * @returns {null} The next character.
 */
export const endOfInput = ({input, position}) => {
  return position >= input.length ? null : void 0;
};