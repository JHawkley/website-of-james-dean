import { atob, btoa } from "abab";

/**
 * Contains functions to encode and decode Base64 strings.
 */
export const base64 = {
  /**
   * Encodes a string into a base64-encoded string.
   * 
   * @param {string} str The string to encode.
   * @returns {string} The encoded string.
  */
  encode(str) { return btoa(str) },

  /**
   * Decodes a base64-encoded string to a normal string.
   *
   * @param {string} str The string to decode.
   * @returns {string} The decoded string.
   */
  decode(str) { return atob(str) }
}

export function isNullishOrEmpty() {
  'use strict'; // Allows binding to `null`.

  if (this == null) return true;
  if (this === "") return true;
  if (typeof this !== "string")
    throw new Error(`expected a string, but found \`${this}\` instead`);
  return false;
}