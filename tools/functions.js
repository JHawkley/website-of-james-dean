// Re-export extension methods.
export * as extensions from "tools/extensions/functions";

/**
 * Creates a new function that wraps `fn` in a try-catch.  If `fn` throws an error, it will return `undefined`.
 *
 * @export
 * @template T,U
 * @param {function(...U): T} fn The function to wrap in a try-catch.
 * @param {*} [thisArg=null] The object to bind to `fn`, when it is called.
 * @returns {function(...U): T|undefined} A new function.
 */
export function trial(fn, thisArg = null) {
  return function(...args) {
    try { return args.length === 0 ? thisArg::fn() : thisArg::fn(...args); }
    catch { return void 0; }
  }
}