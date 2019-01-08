import * as iterEx from "tools/extensions/iterables";

/**
 * Decomposes a regular-expression into its source followed by the flags, ensuring that the "global" flag is set
 * and the "sticky" flag is unset.
 * 
 * @export
 * @param {RegExp} rgx The regular expression to base off of.
 * @returns {[string, string]} A tuple of the source and new flags for a new `RegExp`.
 */
export const globalizedRegExpData = (rgx) => {
  const set = new Set(rgx.flags[Symbol.iterator]());
  set.delete("y");
  set.add("g");
  return [rgx.source, set::iterEx.join("")];
}