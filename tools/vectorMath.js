import { dew } from "./common";
import { extensions as numberEx } from "./numbers";

const q = numberEx.tolerantCompare;
const { sqrt, atan2, sin, cos, abs, PI } = Math;
const { floor: _floor, ceil: _ceil, round: _round } = Math;
const PI2 = PI * 2;

function set(op) {
  this.x = op.x;
  this.y = op.y;
  return this;
}

function setXY(x, y) {
  this.x = x;
  this.y = y;
  return this;
}

function add(op) {
  return this::setXY(this.x + op.x, this.y + op.y);
}

function sub(op) {
  return this::setXY(this.x - op.x, this.y - op.y);
}

function mul(scalar) {
  return this::setXY(this.x * scalar, this.y * scalar);
}

function floor() {
  return this::setXY(_floor(this.x), _floor(this.y));
}

function ceil() {
  return this::setXY(_ceil(this.x), _ceil(this.y));
}

function round() {
  return this::setXY(_round(this.x), _round(this.y));
}

function length() {
  const { x, y } = this;
  return sqrt(x*x + y*y);
}

function makeLength(len) {
  if (len < 0) throw new Error('length must not be less than 0');
  if (len === 0) return this::setXY(0, 0);
  if (this.x === 0 && this.y === 0) return this::setXY(0, len);
  return this::mul(len / this::length());
}

function angle() {
  return atan2(this.x, this.y);
}

function rotate(radians) {
  const { x, y } = this;
  const ax = sin(radians);
  const ay = cos(radians);
  return this::setXY(x * ay - y * ax, x * ax + y * ay);
}

function unit() {
  const [x, y] = dew(() => {
    if (this.x === 0 && this.y === 0) return [0, 0];
    const il = 1 / this::length();
    return [this.x * il, this.y * il];
  });
  return this::setXY(x, y);
}

function normalizeOnX() {
  if (this.x === 0)
    throw new Error('cannot normalize on `x` if it is zero');
  return this::mul(1 / abs(this.x));
}

function normalizeOnY() {
  if (this.y === 0)
    throw new Error('cannot normalize on `y` if it is zero');
  return this::mul(1 / abs(this.y));
}

function perpR() {
  return this::setXY(-this.y, this.x);
}

function perpL() {
  return this::setXY(this.y, -this.x);
}

function dot(op) {
  return (this.x * op.x) + (this.y * op.y);
}

function cross(op) {
  return (this.x * op.y) - (this.y * op.x);
}

function project(target) {
  let lenTarget = target::length();
  if (lenTarget === 0) return 0;
  return this::dot(target) / (lenTarget * lenTarget);
}

function sign(op) {
  return (this.y * op.x > this.x * op.y) ? -1 : 1;
}

function angleBetween(op) {
  const angle = atan2(op.y, op.x) - atan2(this.y, this.x);
  if (angle > PI) return PI2 - angle;
  return -angle;
}

function equals(other) {
  return this.x === other.x && this.y === other.y;
}

function nearlyEquals(other) {
  return this.x::q(other.x) && this.y::q(other.y);
}

/** 
 * An object containing extension-methods.  Use the ESNext bind operator `::` to make use of these.
 * 
 * @export
 */
export const extensions = Object.freeze({
  set, setXY, add, sub, mul, floor, ceil, round, length, makeLength,
  angle, rotate, unit, normalizeOnX, normalizeOnY, perpR, perpL, dot,
  cross, project, sign, angleBetween, equals, nearlyEquals
});