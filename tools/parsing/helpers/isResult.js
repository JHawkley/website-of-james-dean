/**
 * Determines if the value is valid parsing result; anything that is not `undefined`.
 *
 * @export
 * @param {*} v The value to test.
 * @returns {boolean}
 */
export const isResult = (v) => typeof v !== "undefined";