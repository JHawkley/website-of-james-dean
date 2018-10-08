import { dew } from "./common";
import { tolerantCompare as q } from "./numbers";

const { sqrt, atan2, sin, cos, abs, PI } = Math;
const { floor: _floor, ceil: _ceil, round: _round } = Math;
const PI2 = PI * 2;

export function set(op) {
  this.x = op.x;
  this.y = op.y;
  return this;
}

export function setXY(x, y) {
  this.x = x;
  this.y = y;
  return this;
}

export function add(op) {
  return this::setXY(this.x + op.x, this.y + op.y);
}

export function sub(op) {
  return this::setXY(this.x - op.x, this.y - op.y);
}

export function mul(scalar) {
  return this::setXY(this.x * scalar, this.y * scalar);
}

export function floor() {
  return this::setXY(_floor(this.x), _floor(this.y));
}

export function ceil() {
  return this::setXY(_ceil(this.x), _ceil(this.y));
}

export function round() {
  return this::setXY(_round(this.x), _round(this.y));
}

export function length() {
  const { x, y } = this;
  return sqrt(x*x + y*y);
}

export function makeLength(len) {
  if (len < 0) throw new Error('length must not be less than 0');
  if (len === 0) return this::setXY(0, 0);
  if (this.x === 0 && this.y === 0) return this::setXY(0, len);
  return this::mul(len / this::length());
}

export function angle() {
  return atan2(this.x, this.y);
}

export function rotate(radians) {
  const { x, y } = this;
  const ax = sin(radians);
  const ay = cos(radians);
  return this::setXY(x * ay - y * ax, x * ax + y * ay);
}

export function unit() {
  const [x, y] = dew(() => {
    if (this.x === 0 && this.y === 0) return [0, 0];
    const il = 1 / this::length();
    return [this.x * il, this.y * il];
  });
  return this::setXY(x, y);
}

export function normalizeOnX() {
  if (this.x === 0)
    throw new Error('cannot normalize on `x` if it is zero');
  return this::mul(1 / abs(this.x));
}

export function normalizeOnY() {
  if (this.y === 0)
    throw new Error('cannot normalize on `y` if it is zero');
  return this::mul(1 / abs(this.y));
}

export function perpR() {
  return this::setXY(-this.y, this.x);
}

export function perpL() {
  return this::setXY(this.y, -this.x);
}

export function dot(op) {
  return (this.x * op.x) + (this.y * op.y);
}

export function cross(op) {
  return (this.x * op.y) - (this.y * op.x);
}

export function project(target) {
  let lenTarget = target::length();
  if (lenTarget === 0) return 0;
  return this::dot(target) / (lenTarget * lenTarget);
}

export function sign(op) {
  return (this.y * op.x > this.x * op.y) ? -1 : 1;
}

export function angleBetween(op) {
  const angle = atan2(op.y, op.x) - atan2(this.y, this.x);
  if (angle > PI) return PI2 - angle;
  return -angle;
}

export function equals(other) {
  return this.x === other.x && this.y === other.y;
}

export function nearlyEquals(other) {
  return this.x::q(other.x) && this.y::q(other.y);
}