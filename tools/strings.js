import atob from "babel-loader?{'presets':['next/babel']}!abab/lib/atob";
import btoa from "babel-loader?{'presets':['next/babel']}!abab/lib/btoa";

// Re-export extension methods.
export * as extensions from "tools/extensions/strings";

/**
 * Contains functions to encode and decode Base64 strings.
 * 
 * @export
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
};