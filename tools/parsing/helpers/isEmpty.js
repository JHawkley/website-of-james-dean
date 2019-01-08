import { emptyResult } from "../core/emptyResult";

/**
 * Determines if the value is some kind of empty-value.
 *
 * @export
 * @param {*} v The value to test.
 * @returns {boolean}
 */
export const isEmpty = (v) => v === emptyResult;