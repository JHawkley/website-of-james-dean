const { PI, abs, min, max } = Math;

const PI2 = PI * 2;
const e = 0.00000001;

function modulo(a, b) {
  return (+a % (b = +b) + b) % b;
}

function normalizeAngle_Deg(input) {
  return modulo(input, 360);
}

function normalizeAngle_Rad(input) {
  return modulo(input, PI2);
}

/**
 * Compares `this` number to an `other` number in a manner tolerant of floating-point errors.
 *
 * @export
 * @param {number} this This number.
 * @param {number} other The other number.
 * @returns {boolean} A boolean indicating rough equality.
 */
export function tolerantCompare(other) {
  return abs(this - other) < e;
}

/**
 * Linearly interpolates between the range `start` and `end` by `this` number.  The range is not clamped.
 *
 * @export 
 * @param {number} this This number.
 * @param {number} start The low end of the range.
 * @param {number} end The high end of the range.
 * @returns {number} The result of the interpolation.
 */
export function lerp(start, end) {
  return start + (end - start) * this;
}

/**
 * Maps `this` number from the range of `inStart` to `inEnd` to the range of `outStart` to `outEnd`.
 * Neither range is clamped.
 *
 * @export
 * @param {number} this This number.
 * @param {number} inStart The start of the input range.
 * @param {number} inEnd The end of the input range.
 * @param {number} outStart The start of the output range.
 * @param {number} outEnd The end of the output range.
 * @returns {number} The number, remapped.
 */
export function map(inStart, inEnd, outStart, outEnd) {
  return outStart + (outEnd - outStart) * ((this - inStart) / (inEnd - inStart));
}

/**
 * Clamps this number between the range between `start` and `end`.  If only `start` is provided, then it will
 * clamp between 0.0 and `start`.
 *
 * @export
 * @param {number} this This number.
 * @param {number} start The start of the range.
 * @param {number} [end] The end of the range.
 * @returns {number} This number clamped.
 */
export function clamp(start, end) {
  if (typeof end === "undefined") return this::clamp(0.0, start);
  if (start > end) return max(end, min(start, this));
  return min(end, max(start, this));
}

/**
 * Indicates whether this number is between the given range.
 *
 * @export
 * @param {number} this This number.
 * @param {number} start The start of the range.
 * @param {number} end The end of the range.
 * @returns {boolean} Whether this number lies in the range.
 */
export function inRange(start, end) {
  if (start > end) return this::inRange(end, start);
  if (this < start) return false;
  if (this > end) return false;
  return true;
}

/**
 * Gets the sign of `this` number.  Unlike `Number..sign`, this version always counts `0` as positive.
 *
 * @export
 * @param {number} this This number.
 * @returns {1 | -1} Either `1` if greater-than-or-equal to zero or `-1` otherwise.
 */
export function sign() {
  return this >= 0 ? 1 : -1;
}

/**
 * Converts `this` number of radians to degrees.
 *
 * @export
 * @param {number} this This number, representing an angle in radians.
 * @returns {number} The number converted to degrees.
 */
export function toDegrees() {
  return this * (180 / PI);
}

/**
 * Converts `this` number of degrees to radians.
 *
 * @export
 * @param {number} this This number, representing an angle in degrees.
 * @returns {number} The number converted to radians.
 */
export function toRadians() {
  return this * (PI / 180);
}

/**
 * Compares `this` angle with an `other` angle, both in degrees.  This function will normalize both values so
 * that they lie between the range of `0..360`.  The comparison is done in a tolerant way.
 *
 * @export
 * @param {number} this This number, representing an angle in degrees.
 * @param {number} other Another number, representing an angle in degrees.
 * @returns {boolean} Whether the numbers represent roughly the same angle.
 */
export function compareAngleDegrees(other) {
  let self = this;
  if (self < 0 || self >= 360)
    self = normalizeAngle_Deg(this);
  if (other < 0 || other >= 360)
    other = normalizeAngle_Deg(other);
  return self::tolerantCompare(other);
}

/**
 * Compares `this` angle with an `other` angle, both in radians.  This function will normalize both values so
 * that they lie between the range of `0..(PI*2)`.  The comparison is done in a tolerant way.
 *
 * @export
 * @param {number} this This number, representing an angle in radians.
 * @param {number} other Another number, representing an angle in radians.
 * @returns {boolean} Whether the numbers represent roughly the same angle.
 */
export function compareAngleRadians(other) {
  let self = this;
  if (self < 0 || self >= PI2)
    self = normalizeAngle_Rad(self);
  if (other < 0 || other >= PI2)
    other = normalizeAngle_Rad(other);
  return self::tolerantCompare(other);
}