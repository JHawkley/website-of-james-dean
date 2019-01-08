/** 
 * A parser that will match any character.  This parser does not join Unicode code-points for characters on the
 * Unicode astral-plane, and will return each code-point separately.
 * 
 * @type {Parser<string>}
 */
export const any = (state) => {
  const { input, position } = state;
  if (position >= input.length) return void 0;
  const char = input[position];
  state.position = position + 1;
  return char;
};