const loaderUtils = require("loader-utils");

function codePatchLoader(content) {
  if (this.cacheable) this.cacheable();

  let { patches } = loaderUtils.getOptions(this);
  if (!Array.isArray(patches))
    patches = [patches];

  const changes = [];
  
  for (const {search, code, mode = "before"} of patches) {
    for (const {index, length} of matchesOf(search, content)) {
      switch (mode) {
        case "before":
          changes.push(new CodeFragment(code, index, 0));
          break;
        case "after":
          changes.push(new CodeFragment(code, index + length, 0));
          break;
        case "replace":
          changes.push(new CodeFragment(code, index, length));
          break;
        default:
          throw new Error(`unknown patch mode: ${mode}`);
      }
    }
  }

  const patchedFragments = changes.reduce((fragments, change) => {
    for (let i = 0, len = fragments.length; i < len; i++) {
      const fragment = fragments[i];
      const result = fragment.process(change);
      if (result == null) continue;
      return [...range(fragments, 0, i), ...result, ...range(fragments, i + 1)];
    }
    return fragments;
  }, [CodeFragment.fromString(content, 0)]);

  return patchedFragments.map(v => v.toString()).join("");
}

/**
 * Values indicating the relative relationship between two code fragments.
 * @enum
 * @readonly
*/
const Relations = {
  /** `b` comes entirely before `a` */
  before: Symbol("code-fragment:relation:before"),
  /** `b` can be safely inserted before `a` */
  insertBefore: Symbol("code-fragment:relation:insert-before"),
  /** `b` overlaps with `a` */
  overlap: Symbol("code-fragment:relation:overlap"),
  /** `b` can be safely inserted after `a` */
  insertAfter: Symbol("code-fragment:relation:insert-after"),
  /** `b` comes entirely after `a` */
  after: Symbol("code-fragment:relation:after")
};

class CodeFragment {

  get start() { return this.index; }
  get end() { return this.index + this.skip - 1; }

  constructor(code, index, skip = 0) {
    this.code = code;
    this.index = index;
    this.skip = typeof skip === "number" ? skip : (skip === false ? code.length : 0);
    this.isPatch = skip !== false;
  }

  process(fragment) {
    switch(CodeFragment.relation(this, fragment)) {
      case Relations.insertBefore: return [fragment, this];
      case Relations.insertAfter: return [this, fragment];
      case Relations.before: return [this];
      case Relations.after: return null;
    }

    // We have an overlap.
    if (this.isPatch) return [this];
    
    const { start: aMin, end: aMax } = this;
    const { start: bMin, end: bMax } = fragment;
    // If the two fragments perfectly overlap, replace this fragment with that.
    if (aMin === bMin && aMax === bMax) return [fragment];
    // If this fragment does not completely contain the other fragment, discard the other fragment.
    if (aMin > bMin || aMax < bMax) return [this];
    // Split this fragment into two.
    const rIndex = fragment.index + fragment.skip;
    const lCut = fragment.index - this.index;
    const rCut = rIndex - this.index;
    const left = CodeFragment.fromString(this.code.substring(0, lCut), this.index);
    const right = CodeFragment.fromString(this.code.substring(rCut), rIndex);
    return [left, fragment, right];
  }

  toString() { return this.code; }

  /**
   * Determines the relative position between code fragments `a` and `b`.
   * 
   * @param {CodeFragment} a A code fragment.
   * @param {CodeFragment} b The code fragment to relate `a` to.
   * @returns {Relations} How `b` relates to `a` in terms of position.
  */
  static relation(a, b) {
    if (a.index === b.index) {
      if (a.skip === 0) return Relations.insertAfter;
      if (b.skip === 0) return Relations.insertBefore;
    }
    if (a.index >= b.index + b.skip) return Relations.before;
    if (b.index >= a.index + a.skip) return Relations.after;
    return Relations.overlap;
  }

  static fromString(str, index) {
    if (typeof str !== "string")
      throw new Error("provided argument was not a string");
    
    return new CodeFragment(str, index, false);
  }

}

function* range(array, start = 0, end = array.length) {
  for (let i = start; i < end; i++) yield array[i];
}

function* matchesOf(search, content) {
  const regex = new RegExp(search);
  let result = regex.exec(content);

  while (result != null) {
    yield { index: result.index, length: result[0].length };
    if (!regex.global || regex.sticky) break;
    result = regex.exec(content);
  }
}

module.exports = codePatchLoader;