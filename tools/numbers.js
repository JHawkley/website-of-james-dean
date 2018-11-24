const { PI, abs, min, max, random } = Math;

// function randomBetween
// object extensions

/**
 * @typedef ArrayLike
 * @property {number} length The length of the array-like.
 */

const PI2 = PI * 2;
const e = 0.00000001;

function modulo(a, b) {
  return (+a % (b = +b) + b) % b;
}

function normalizeAngle_Rad(input) {
  return modulo(input, PI2);
}

/**
 * Compares `this` number to an `other` number in a manner tolerant of floating-point errors.
 *
 * @this {number} This number.
 * @param {number} other The other number.
 * @returns {boolean} A boolean indicating rough equality.
 */
function tolerantCompare(other) {
  return abs(this - other) < e;
}

/**
 * Linearly interpolates between the range `start` and `end` by `this` number.  The range is not clamped.
 *
 * @this {number} This number.
 * @param {number} start The low end of the range.
 * @param {number} end The high end of the range.
 * @returns {number} The result of the interpolation.
 */
function lerp(start, end) {
  return start + (end - start) * this;
}

/**
 * Maps `this` number from the range of `inStart` to `inEnd` to the range of `outStart` to `outEnd`.
 * Neither range is clamped.
 *
 * @this {number} This number.
 * @param {number} inStart The start of the input range.
 * @param {number} inEnd The end of the input range.
 * @param {number} outStart The start of the output range.
 * @param {number} outEnd The end of the output range.
 * @returns {number} The number, remapped.
 */
function map(inStart, inEnd, outStart, outEnd) {
  return outStart + (outEnd - outStart) * ((this - inStart) / (inEnd - inStart));
}

/**
 * Clamps this number between the inclusive range of `start` and `end`.  If only `start` is provided, then
 * it will clamp between 0.0 and `start`.
 *
 * @this {number} This number.
 * @param {number} start The start of the range.
 * @param {number} [end] The end of the range.
 * @returns {number} This number clamped.
 */
function clamp(start, end) {
  if (typeof end === "undefined") return this::clamp(0.0, start);
  if (start > end) return max(end, min(start, this));
  return min(end, max(start, this));
}

/**
 * Clamps this number to the range specified by an array-like object.  Handy for making sure an index is
 * always in the bounds of an array.
 *
 * @this {number} This number.
 * @param {ArrayLike} arrayLike Something with a `length` property.
 * @returns {number} The number, clamped to the range of the `arrayLike`.
 * @throws When `arrayLike` is not array-like.
 * @throws When the `arrayLike` is empty (length of 0).
 */
function clampBy(arrayLike) {
  if (typeof arrayLike?.length !== "number")
    throw new Error("cannot clamp the number to the array-like; it has no length property");

  const len = arrayLike.length;

  if (len <= 0)
    throw new Error("cannot clamp the number to the array-like; it is empty");

  return this::clamp(0, len - 1);
}

/**
 * Reflows this number, ensuring it is in the bounds of the inclusive range of 0 and `end`.  If `this`
 * underflows or overflows the range, it will be wrapped to the other end of the range until the number
 * sits within the range.
 *
 * @this {number} This number.
 * @param {number} limit The limit of the range, starting from zero.
 * @returns {number} The reflowed number.
 */
function reflow(limit) {
  return this::reflowRange(0, limit);
}

/**
 * Reflows this number, ensuring it is in the bounds of the inclusive range defined by `start` and `end`.
 * If `this` underflows or overflows the range, it will be wrapped to the other end of the range until the
 * number sits within the range.
 *
 * @this {number} This number.
 * @param {number} start The start of the range.
 * @param {number} end The end of the range.
 * @returns {number} The reflowed number.
 */
function reflowRange(start, end) {
  if (start > end) return this::reflowRange(end, start);
  return modulo((this - start), (end - start + 1)) + start;
}

/**
 * Reflows this number to the range specified by an array-like object.  Handy for making sure an index is
 * always in the bounds of an array.
 *
 * @this {number} This number.
 * @param {ArrayLike} arrayLike Something with a `length` property.
 * @returns {number} The number, reflowed, so that it is bound to the range of the array.
 * @throws When `arrayLike` is not array-like.
 * @throws When the `arrayLike` is empty (length of 0).
 */
function reflowBy(arrayLike) {
  if (typeof arrayLike?.length !== "number")
    throw new Error("cannot reflow the number to the array-like; it has no length property");

  const len = arrayLike.length;

  if (len <= 0)
    throw new Error("cannot reflow the number to the array-like; it is empty");

  return this::reflowRange(0, len - 1);
}

/**
 * Indicates whether this number is between the given range.
 *
 * @this {number} This number.
 * @param {number} start The start of the range.
 * @param {number} end The end of the range.
 * @returns {boolean} Whether this number lies in the range.
 */
function inRange(start, end) {
  if (start > end) return this::inRange(end, start);
  if (this < start) return false;
  if (this > end) return false;
  return true;
}

/**
 * Gets the sign of `this` number.  Unlike `Number..sign`, this version always counts `0` as positive.
 *
 * @this {number} This number.
 * @returns {1 | -1} Either `1` if greater-than-or-equal to zero or `-1` otherwise.
 */
function sign() {
  return this >= 0 ? 1 : -1;
}

/**
 * Converts `this` number of radians to degrees.
 *
 * @this {number} This number, representing an angle in radians.
 * @returns {number} The number converted to degrees.
 */
function toDegrees() {
  return this * (180 / PI);
}

/**
 * Converts `this` number of degrees to radians.
 *
 * @this {number} This number, representing an angle in degrees.
 * @returns {number} The number converted to radians.
 */
function toRadians() {
  return this * (PI / 180);
}

/**
 * Compares `this` angle with an `other` angle, both in radians.  This function will normalize both values so
 * that they lie between the range of `0..(PI*2)`.  The comparison is done in a tolerant way.
 *
 * @this {number} This number, representing an angle in radians.
 * @param {number} other Another number, representing an angle in radians.
 * @returns {boolean} Whether the numbers represent roughly the same angle.
 */
function compareAngle(other) {
  let self = this;
  if (self < 0 || self >= PI2)
    self = normalizeAngle_Rad(self);
  if (other < 0 || other >= PI2)
    other = normalizeAngle_Rad(other);
  return self::tolerantCompare(other);
}

/**
 * Determines if this number, treated as an angle in radians, is between `min` and `max`.  This function will
 * normalize all values so that they lie between the range of `0..(PI*2)`.
 * 
 * If `min` is greater than `max`, then the inverse slice of the circle will be used.
 *
 * @this {number} This number, an angle in radians.
 * @param {number} min The minimum angle of the range.
 * @param {number} max The maximum angle of the range.
 * @returns {boolean} Whether this number is an angle between the `min` and `max` angles.
 */
function angleInRange(min, max) {
  if (min === max) return this::compareAngle(min, max);

  let self = this;
  if (min < 0 || min >= PI2)
    min = normalizeAngle_Rad(min);
  if (max < 0 || max >= PI2)
    max = normalizeAngle_Rad(max);
  if (self < 0 || self >= PI2)
    self = normalizeAngle_Rad(self);
  return min < max ? (self >= min && self <= max) : (self >= min || self <= max);
}

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

/** 
 * An object containing extension-methods.  Use the ESNext bind operator `::` to make use of these.
 * 
 * @export
 */
export const extensions = Object.freeze({
  tolerantCompare, lerp, map, clamp, clampBy, reflow, reflowRange, reflowBy,
  inRange, sign, toDegrees, toRadians, compareAngle, angleInRange
});