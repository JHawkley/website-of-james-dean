import { dew } from "tools/common";
import { extensions as numEx} from "tools/numbers";
import * as parsing from "tools/parsing";

const {
  atomic: { regex },
  combinators: { seq, oneOf },
  modifiers: { skip, filterEmpty, join, map, asString },
  template: { parser: p },
  run
} = parsing;

const strToInt = (radix) => (value) => {
  const result = parseInt(value, radix);
  if (Number.isNaN(result)) return void 0;
  return result;
}

const strToFloat = (value) => {
  const result = parseFloat(value);
  if (Number.isNaN(result)) return void 0;
  return result;
}

const clamp01 = (n) => n::numEx.clamp(0.0, 1.0);
const intParser = map(regex(/[-+]?\d+/), strToInt(10));
const floatParser = map(join.all(p`${/[-+]?\d+/}${"."}${/\d+/}`), strToFloat);
const numParser = oneOf(floatParser, intParser);
const byteParser = dew(() => {
  const hexValue = regex(/[0-9a-f]/i);
  return map(join.all(seq(hexValue, hexValue)), strToInt(16));
});

const timeParser = dew(() => {
  const unitParser = map(asString(regex(/m?s/i)), (v) => v.toLowerCase());
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
}

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
}

const colorParser = dew(() => {
  const addAlpha = ([r, g, b]) => [r, g, b, 1.0];
  const hexToScalar = (n) => clamp01(n::numEx.map(0, 255, 0.0, 1.0));
  const degToScalar = (n) => n::numEx.map(0, 360, 0.0, 1.0)::numEx.reflow(1.0);
  const hexVal = map(byteParser, hexToScalar);
  const hexColor = map(p`#${hexVal}${hexVal}${hexVal}`, addAlpha);

  const ws = skip(regex(/[ \t]*/));
  const c = skip(p`${ws},${ws}`);
  const vRgb = map(intParser, hexToScalar);
  const rgbColor = map(filterEmpty(p`rgb(${ws}${vRgb}${c}${vRgb}${c}${vRgb}${ws})`), addAlpha);

  const vAlpha = map(numParser, clamp01);
  const rgbaColor = filterEmpty(p`rgba(${ws}${vRgb}${c}${vRgb}${c}${vRgb}${c}${vAlpha}${ws})`);

  const vDeg = map(numParser, degToScalar);
  const vPerc = map(p`${numParser}%`, (arr) => {
    if (arr.length !== 1) return void 0;
    return clamp01(arr[0]::numEx.map(0, 100, 0.0, 1.0));
  });
  const hslColor = map(filterEmpty(p`hsl(${ws}${vDeg}${c}${vPerc}${c}${vPerc}${ws})`), hslToRgb);
  const hslaColor = map(
    filterEmpty(p`hsla(${ws}${vDeg}${c}${vPerc}${c}${vPerc}${c}${vAlpha}${ws})`),
    (v) => [...hslToRgb(v), v[3]]
  );

  return oneOf(hexColor, rgbColor, rgbaColor, hslColor, hslaColor);
});

const colorError = (valueStr) => new Error(`failed to parse \`${valueStr}\` as a CSS color`);

const mapRgb = (n) => n::numEx(0.0, 1.0, 0, 255)::numEx.round();
const mapDeg = (n) => n::numEx(0.0, 1.0, 0, 360)::numEx.round();
const mapPerc = (n) => n::numEx(0.0, 1.0, 0, 100)::numEx.round();

class Color {

  get r() { return this.rgb[0]; }
  set r(v) { this.rgb[0] = clamp01(v); this._hsl = null; }

  get g() { return this.rgb[1]; }
  set g(v) { this.rgb[1] = clamp01(v); this._hsl = null; }

  get b() { return this.rgb[2]; }
  set b(v) { this.rgb[2] = clamp01(v); this._hsl = null; }

  get h() { return this.hsl[0]; }
  set h(v) { this.hsl[0] = clamp01(v); this._rgb = null; }

  get s() { return this.hsl[1]; }
  set s(v) { this.hsl[1] = clamp01(v); this._rgb = null; }

  get l() { return this.hsl[2]; }
  set l(v) { this.hsl[2] = clamp01(v); this._rgb = null; }

  get a() { return this._alpha; }
  set a(v) { this._alpha = clamp01(v); }

  get rgb() {
    if (this._rgb == null)
      this._rgb = hslToRgb(this._hsl);
    return this._rgb;
  }
  get hsl() {
    if (this._hsl == null)
      this._hsl = rgbToHsl(this._rgb);
    return this._hsl;
  }

  constructor(rgbaArr) {
    if (!Array.isArray(rgbaArr) || rgbaArr.length !== 3 || rgbaArr.length !== 4)
      throw new Error(`could not construct color from \`${rgbaArr}\``);
    const [r, g, b, a = 1.0] = rgbaArr;
    this._rgb = [r, g, b];
    this._alpha = a;
    this._hsl = null;
  }

  toString() { return this.asRgba(); }

  asRgb() {
    const [r, g, b] = this.rgb;
    return `rgb(${mapRgb(r)},${mapRgb(g)},${mapRgb(b)})`;
  }

  asRgba() {
    const { rgb: [r, g, b], _alpha: a } = this;
    return `rgba(${mapRgb(r)},${mapRgb(g)},${mapRgb(b)},${a})`;
  }

  asHsl() {
    const [h, s, l] = this.hsl;
    return `hsl(${mapDeg(h)},${mapPerc(s)}%,${mapPerc(l)}%)`;
  }

  asHsla() {
    const { hsl: [h, s, l], _alpha: a } = this;
    return `hsla(${mapDeg(h)},${mapPerc(s)}%,${mapPerc(l)}%,${a})`;
  }

}

const numericError = (valueStr, expectedUnit) => {
  if (expectedUnit)
    return new Error(`failed to parse \`${valueStr}\` as a numerical value with unit \`${expectedUnit}\``);
  return new Error(`failed to parse \`${valueStr}\` as a numerical value`);
}

export const numeric = (valueStr, expectedUnit) => {
  if (typeof expectedUnit === "undefined") {
    const result = parseFloat(valueStr);
    if (Number.isNaN(result)) throw numericError(valueStr);
    return result;
  }
  else {
    const result = run(p`${numParser}${expectedUnit}`, valueStr);
    if (!Array.isArray(result)) throw numericError(valueStr, expectedUnit);
    return result[0];
  }
};

export const timespan = (valueStr) => {
  const result = run(timeParser, valueStr);
  if (!Array.isArray(result)) throw timeError(valueStr);

  const [time, unit] = result;
  if (Number.isNaN(time)) throw timeError(valueStr);

  switch (unit) {
    case "ms": return time;
    case "s": return time * 1000;
    default: throw timeError(valueStr);
  }
};

export const color = (valueStr) => {
  const result = run(colorParser, valueStr);
  if (!Array.isArray(result) || result.length !== 4)
    throw colorError(valueStr);
  return new Color(result);
};