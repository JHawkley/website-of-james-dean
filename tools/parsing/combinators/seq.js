import { arr } from "./arr";

/**
 * Creates a parser that will try to apply all the given parsers and produce an array of their results.
 *
 * @export
 * @template T
 * @param {...Parser<T>} parsers The parsers to run in sequence.
 * @returns {BacktrackingParser<T[]>} A parser that results in an array of parsing results.
 */
export const seq = (...parsers) => arr(parsers);