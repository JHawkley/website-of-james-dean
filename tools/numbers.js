import { map } from "tools/extensions/numbers";

const { random } = Math;

// Re-export extension methods.
export * as extensions from "tools/extensions/numbers";

/**
 * Produces a random number between `min` and `max`.
 *
 * @export
 * @param {number} min The minimum of the range.
 * @param {number} max The maximum of the range.
 * @returns {number} A random number.
 */
export function randomBetween(min, max) {
  if (min === max) return min;
  return random()::map(0.0, 1.0, min, max);
}