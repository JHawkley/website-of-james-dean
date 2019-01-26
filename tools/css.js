import { dew, is } from "tools/common";
import { extensions as numEx} from "tools/numbers";
import * as parsing from "tools/parsing";
import { run } from "tools/parsing";

/**
 * Parses some numeric value, returning an tuple-array of the numeric component and the unit.
 * 
 * If `expectedUnit` is provided, an error will be thrown if the match failed.  The `expectedUnit`
 * argument can be a string, a regular-expression, a parsing function, or an array containing
 * any of the former.  Arrays are treated as "can be any one of these".
 * 
 * If `expectedUnit` is not provided, and there was no unit component, the unit will be an
 * empty-string.
 *
 * @export
 * @param {string} valueStr The string to parse.
 * @param {*} [expectedUnit] The expected unit.
 * @returns {[number, string]} A tuple of the parsed number and its unit.
 */
export function numeric(valueStr, expectedUnit) {
  if (expectedUnit == null) {
    const result = run(numUnitParser, valueStr);
    if (!Array.isArray(result)) throw numericError(valueStr);
    return result;
  }
  else {
    const result = run(p`${numParser}${expectedUnit}`, valueStr);
    if (!Array.isArray(result)) throw numericError(valueStr, expectedUnit);
    return result;
  }
}

/**
 * Parses a CSS timespan value, producing it as a number of milliseconds.
 *
 * @export
 * @param {string} valueStr The string to parse.
 * @returns {number} The timespan, in milliseconds.
 */
export function timespan(valueStr) {
  const result = run(timeParser, valueStr);
  if (!Array.isArray(result)) throw timeError(valueStr);

  const [time, unit] = result;
  if (Number.isNaN(time)) throw timeError(valueStr);

  switch (unit) {
    case "ms": return time;
    case "s": return time * 1000;
    default: throw timeError(valueStr);
  }
}

/**
 * Parses a CSS color.  The result is a `Color` class which can be used to manipulate the color.
 *
 * @export
 * @param {string} valueStr The string to parse.
 * @returns {Color} A representation of the color.
 */
export function color(valueStr) {
  const result = run(colorParser, valueStr);
  if (!Array.isArray(result) || result.length !== 4)
    throw colorError(valueStr);
  return new Color(result);
}

/**
 * Parses a CSS string, that is something wrapped in single or double quotes.  The string is returned
 * with the quotes removed.  If the string was not wrapped in quotes, the original string is returned as-is.
 *
 * @export
 * @param {string} cssStr The string to parse.
 * @returns {string} The string, with surrounding quotes removed.
 */
export function dequote(cssStr) {
  const result = run(stringParser, cssStr);
  if (!Array.isArray(result)) return cssStr;
  return result[0];
}

/**
 * A class that provides representation and manipulation of parsed CSS colors.
 *
 * @class Color
 */
class Color {

  /**
   * The red-channel of the color, a value in the range `0..1`.
   *
   * @property {number}
   * @memberof Color
   */
  get r() { return this.rgb[0]; }
  set r(v) { this.rgb[0] = clamp01(v); }

  /**
   * The green-channel of the color, a value in the range `0..1`.
   *
   * @property {number}
   * @memberof Color
   */
  get g() { return this.rgb[1]; }
  set g(v) { this.rgb[1] = clamp01(v); }

  /**
   * The blue-channel of the color, a value in the range `0..1`.
   *
   * @property {number}
   * @memberof Color
   */
  get b() { return this.rgb[2]; }
  set b(v) { this.rgb[2] = clamp01(v); }

  /**
   * The hue of the color, a value in the range `0..1`.
   *
   * @property {number}
   * @memberof Color
   */
  get h() { return this.hsl[0]; }
  set h(v) { this.hsl[0] = v::numEx.reflow(1.0); }

  /**
   * The saturation of the color, a value in the range `0..1`.
   *
   * @property {number}
   * @memberof Color
   */
  get s() { return this.hsl[1]; }
  set s(v) { this.hsl[1] = clamp01(v); }

  /**
   * The lightness of the color, a value in the range `0..1`.
   *
   * @property {number}
   * @memberof Color
   */
  get l() { return this.hsl[2]; }
  set l(v) { this.hsl[2] = clamp01(v); }

  /**
   * The alpha-channel of the color, a value in the range `0..1`.
   *
   * @property {number}
   * @memberof Color
   */
  get a() { return this._alpha; }
  set a(v) { this._alpha = clamp01(v); }

  /**
   * A tuple of the red, green, and blue channels.  All values are in the range `0..1`.
   * If this array is manipulated directly, be sure to validate the inputs are in the appropriate range.
   *
   * @property {[number, number, number]}
   * @memberof Color
   * @readonly
   */
  get rgb() {
    if (this._rgb == null) {
      this._rgb = hslToRgb(this._hsl);
      this._hsl = null;
    }
    return this._rgb;
  }

  /**
   * A tuple of the color's hue, saturation, and lightness.  All values are in the range `0..1`.
   * If this array is manipulated directly, be sure to validate the inputs are in the appropriate range.
   *
   * @property {[number, number, number]}
   * @memberof Color
   * @readonly
   */
  get hsl() {
    if (this._hsl == null) {
      this._hsl = rgbToHsl(this._rgb);
      this._rgb = null;
    }
    return this._hsl;
  }

  constructor(rgbaArr) {
    if (!Array.isArray(rgbaArr) || (rgbaArr.length !== 3 && rgbaArr.length !== 4))
      throw new Error(`could not construct color from \`${rgbaArr}\``);
    const [r, g, b, a = 1.0] = rgbaArr;
    this._rgb = [r, g, b];
    this._alpha = a;
    this._hsl = null;
  }

  /**
   * Creates a new color with its alpha reduced by `amount`.  Intended to mimic the SASS function of the
   * same name.
   *
   * @param {number} amount The amount of transparency to introduce.
   * @returns {Color} A new color.
   * @memberof Color
   */
  transparentize(amount) {
    return new Color([this.r, this.g, this.b, clamp01(this.a - amount)]);
  }

  /**
   * A string representation of this color.  Alias of `Color#asRgba`.
   *
   * @returns {string}
   * @memberof Color
   */
  toString() { return this.asRgba(); }

  /**
   * Produces an RGB CSS color string.
   *
   * @returns {string}
   * @memberof Color
   */
  asRgb() {
    const [r, g, b] = this.rgb;
    return `rgb(${mapRgb(r)},${mapRgb(g)},${mapRgb(b)})`;
  }

  /**
   * Produces an RGBA CSS color string.
   *
   * @returns {string}
   * @memberof Color
   */
  asRgba() {
    const { rgb: [r, g, b], _alpha: a } = this;
    return `rgba(${mapRgb(r)},${mapRgb(g)},${mapRgb(b)},${a})`;
  }

  /**
   * Produces an HSL CSS color string.
   *
   * @returns {string}
   * @memberof Color
   */
  asHsl() {
    const [h, s, l] = this.hsl;
    return `hsl(${mapDeg(h)},${mapPerc(s)}%,${mapPerc(l)}%)`;
  }

  /**
   * Produces an HSLA CSS color string.
   *
   * @returns {string}
   * @memberof Color
   */
  asHsla() {
    const { hsl: [h, s, l], _alpha: a } = this;
    return `hsla(${mapDeg(h)},${mapPerc(s)}%,${mapPerc(l)}%,${a})`;
  }

}

// Setup below.

const {
  atomic: { regex },
  parsers: { rest },
  combinators: { seq, oneOf },
  modifiers: { skip, filterEmpty, join, map, asString },
  template: { parser: p, interpolate },
  extensions: { chain, specify }
} = parsing;

const strToInt = (radix) => map::specify((value) => {
  const result = parseInt(value, radix);
  if (Number.isNaN(result)) return void 0;
  return result;
});

const strToFloat = map::specify((value) => {
  const result = parseFloat(value);
  if (Number.isNaN(result)) return void 0;
  return result;
});

const clamp01 = (n) => n::numEx.clamp(0.0, 1.0);
const intParser = regex(/[-+]?\d+/)::chain(asString, strToInt(10));
const floatParser = p`${/[-+]?\d+/}${"."}${/\d+/}`::chain(join.all, strToFloat);
const numParser = oneOf(floatParser, intParser);
const numUnitParser = seq(numParser, asString(rest));
const byteParser = dew(() => {
  const hexValue = regex(/[0-9a-f]/i);
  return seq(hexValue, hexValue)::chain(join.all, strToInt(16));
});

const timeParser = dew(() => {
  const unitParser = regex(/m?s/i)::chain(asString, map::specify((v) => v.toLowerCase()));
  return seq(numParser, unitParser);
});

const timeError = (valueStr) => new Error(`failed to parse \`${valueStr}\` as a CSS timespan`);

const hslToRgb = ([h, s, l]) => {
  let r, g, b;

  if(s == 0)
    r = g = b = l; // achromatic
  else {
    const hue2rgb = (p, q, t) => {
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [r, g, b];
};

const rgbToHsl = ([r, g, b]) => {
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if(max == min)
    h = s = 0; // achromatic
  else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h, s, l];
};

const colorParser = dew(() => {
  const addAlpha = map::specify(([r, g, b]) => [r, g, b, 1.0]);
  const byteToScalar = map::specify((n) => n::numEx.mapClamp(0, 255, 0.0, 1.0));
  const degToScalar = map::specify((n) => n::numEx.mapReflow(0, 360, 0.0, 1.0));
  const percToScalar = map::specify((n) => n::numEx.mapClamp(0, 100, 0.0, 1.0));
  const hexVal = byteParser::chain(byteToScalar);
  const hexColor = p`#${hexVal}${hexVal}${hexVal}`::chain(addAlpha);

  const ws = skip(regex(/[ \t]*/));
  const c = skip(p`${ws},${ws}`);
  const vRgb = intParser::chain(byteToScalar);
  const rgbColor = p`rgb(${ws}${vRgb}${c}${vRgb}${c}${vRgb}${ws})`::chain(filterEmpty, addAlpha);

  const vAlpha = map(numParser, clamp01);
  const rgbaColor = filterEmpty(p`rgba(${ws}${vRgb}${c}${vRgb}${c}${vRgb}${c}${vAlpha}${ws})`);

  const vDeg = numParser::chain(degToScalar);
  const vPerc = p`${numParser}%`::chain(map::specify((arr) => arr.length !== 1 ? void 0 : arr[0]), percToScalar);
  const hslColor = p`hsl(${ws}${vDeg}${c}${vPerc}${c}${vPerc}${ws})`::chain(
    filterEmpty,
    map::specify(hslToRgb),
    addAlpha
  );
  const hslaColor = p`hsla(${ws}${vDeg}${c}${vPerc}${c}${vPerc}${c}${vAlpha}${ws})`::chain(
    filterEmpty,
    map::specify((v) => [...hslToRgb(v), v[3]])
  );

  return oneOf(hexColor, rgbColor, rgbaColor, hslColor, hslaColor);
});

const stringParser = dew(() => {
  const quote = p`'${interpolate}'`;
  const doubleQuote = p`"${interpolate}"`;
  return oneOf(quote, doubleQuote);
});

const colorError = (valueStr) => new Error(`failed to parse \`${valueStr}\` as a CSS color`);

const mapRgb = (n) => n::numEx.mapClamp(0.0, 1.0, 0, 255)::numEx.round();
const mapDeg = (n) => n::numEx.mapReflow(0.0, 1.0, 0, 360)::numEx.round();
const mapPerc = (n) => n::numEx.mapClamp(0.0, 1.0, 0, 100)::numEx.round();

const numericError = (valueStr, expectedUnit) => {
  if (expectedUnit)
    return new Error(`failed to parse \`${valueStr}\` as a numerical value with unit \`${expectedUnit.toString()}\``);
  return new Error(`failed to parse \`${valueStr}\` as a numerical value`);
}