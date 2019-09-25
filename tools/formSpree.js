import { extensions as numEx } from "tools/numbers";
import { base64 } from "tools/strings";

function mapOfCharToIndex() {
  const output = {};
  const length = this.length;
  for (let i = 0; i < length; i++)
    output[this[i]] = i;
  return output;
}

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const charsToIndex = chars::mapOfCharToIndex();
const vpfr = [
  179, 253, 191, 2, 251, 221, 28, 56, 219, 185, 140, 29, 99, 72, 97, 71, 239, 192, 170, 230,
  33, 149, 71, 18, 154, 199, 215, 10, 139, 190, 22, 64, 135, 202, 185, 240, 92, 49, 56, 72,
  118, 101, 153, 15, 2, 162, 104, 254, 64, 150, 14, 54, 41, 50, 163, 247, 114, 154, 204, 115,
  147, 80, 2, 119
];

export function rng(count) {
  if (process.env.NODE_ENV !== "production") {
    const min = 1;
    const max = 255;
    const range = max - min;
    const output = [];
    for (let i = 0; i < count; i++)
      output[i] = ((Math.random() * range) | 0) + min;
    return "[" + output.join(", ") + "]";
  }

  // Returned only when in production.
  return "";
}

export function ins(str) {
  if (process.env.NODE_ENV !== "production") {
    const barr = base64.encode(str).split("");
    const barrLen = barr.length;
    const vpfrLen = vpfr.length;
    const charsLen = chars.length;
    for (let i = 0; i < barrLen; i++) {
      const offset = vpfr[i::numEx.reflow(vpfrLen - 1)];
      const ci = charsToIndex[barr[i]];
      if (typeof ci === "undefined") continue;
      const co = (ci + offset)::numEx.reflow(charsLen - 1);
      barr[i] = chars[co];
    }
    return barr.join("");
  }

  // Returned only when in production.
  return "";
}

export function outs(str) {
  const barr = str.split("");
  const barrLen = barr.length;
  const vpfrLen = vpfr.length;
  const charsLen = chars.length;
  for (let i = 0; i < barrLen; i++) {
    const offset = vpfr[i::numEx.reflow(vpfrLen - 1)];
    const ci = charsToIndex[barr[i]];
    if (typeof ci === "undefined") continue;
    const co = (ci - offset)::numEx.reflow(charsLen - 1);
    barr[i] = chars[co];
  }
  return base64.decode(barr.join(""));
}

// The current, encoded email address.
// Intended to be bare-bones protection from bot scraping.
export const formTarget = "NEQ2XkoymrJD+/q0L3rY6rbA0dT5lkbtghFe13NpRHSGd2plbsTfE0caNQA=";