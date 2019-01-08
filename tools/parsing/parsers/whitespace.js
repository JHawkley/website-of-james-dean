import { asString } from "../modifiers/asString";
import { regex } from "../atomic/regex";

/**
 * A parser that will match one-or-more whitespace characters.
 * 
 * @type {Parser<string>}
 */
export const whitespace = asString(regex(/\s+/));

/**
 * A parser that will match zero-or-more whitespace characters.
 * 
 * @type {Parser<string>}
 */
whitespace.optional = asString(regex(/\s*/));