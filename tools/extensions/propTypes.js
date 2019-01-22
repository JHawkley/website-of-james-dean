import PropTypes from "prop-types";
import { is } from "tools/common";
import { fold } from "tools/array";
import { makeValidator } from "tools/propTypes";
import { run } from "tools/parsing";

/**
 * Attaches a predicate to this prop-type validator function.  The prop-type must both pass
 * the validator, as well as the additional predicate to validate successfully.
 * 
 * The predicate must return `true` in the case the predicate succeeds; any other value will
 * be considered a failure.  If the return value is a string or an array-of-strings, then that
 * will be treated as the reasoning behind the failure.
 *
 * @export
 * @this {module:tools/propTypes.Validator}
 * @param {module:tools/propTypes.PredicateFunction} [predicate] The predicate to attach.
 * @returns {module:tools/propTypes.Validator} A prop-type validator function.
 */
export function predicate(predicate) {
  if (!this::is.func())
    throw new TypeError("expected to be bound to a prop-type validator function");

  if (!predicate::is.func())
    throw new TypeError("invalid argument for `predicate`; expected a function");

  const validationFn = (value, key, props) => {
    const result = predicate(value, key, props);

    switch (true) {
      case result === true:
        return;
      case result::is.string():
      case result::is.array():
        return result;
      default:
        return name`predicate ${predicate} failed`;
    }
  };
  
  return makeValidator(validationFn, this);
}

/**
 * Turns this regular-expression object into a custom-prop validator.
 *
 * @export
 * @this {RegExp}
 * @param {string} [failureText] Some text to display in error in the case the match fails.
 * @returns {module:tools/propTypes.Validator} A prop-type validator function.
 */
export function match(failureText) {
  if (!this::is.instanceOf(RegExp))
    throw new TypeError("expected to be bound to a regular-expression");
  
  const validationFn = (value) => {
    const matched = this.test(value);
    if (matched) return;

    const error = [`the regular-expression \`/${this.source}/${this.flags}\` failed to match \`${value}\``];
    if (failureText) error.push(failureText);
    return error;
  };
  
  return makeValidator(validationFn, PropTypes.string);
}

/**
 * Turns this parsing function into a custom-prop validator.
 *
 * @export
 * @this {module:tools/parsing.Parser}
 * @param {string} [failureText] Some text to display in error in the case the parser fails.
 * @returns {module:tools/propTypes.Validator} A prop-type validator function.
 */
export function parse(failureText) {
  if (!this::is.func())
    throw new TypeError("expected to be bound to a function, to be treated as a parser");
  
  const validationFn = (value) => {
    const result = run(this, value);
    if (!result::is.undefined()) return;

    const error = [name`parser ${this} failed to parse value \`${value}\``];
    if (failureText) error.push(failureText);
    return error;
  };
  
  return makeValidator(validationFn, PropTypes.string);
}

/**
 * Adds an expectation to this validator that, when this property is present and its value is not `false`,
 * the properties in the `propKeys` array should also be present.
 *
 * @export
 * @this {module:tools/propTypes.Validator}
 * @param {string[]} propKeys
 * @returns {module:tools/propTypes.Validator} A prop-type validator function.
 */
export function dependsOn(propKeys) {
  if (!this::is.func())
    throw new TypeError("expected to be bound to a function");
  
  if (propKeys::is.string())
    propKeys = [propKeys];

  if (!propKeys::is.array())
    throw new TypeError("invalid argument for `propKeys`; expected either a string or an array-of-strings");
  else if (!propKeys.every(v => v::is.string()))
    throw new TypeError("invalid argument for `propKeys`; when an array, it can only contain strings");

  const validationFn = (value, key, props) => {
    if (value === false) return;

    const missingProps = propKeys.filter(k => props[k] == null).map(k => `\`${k}\``);

    if (missingProps.length > 0)
      return `the \`${key}\` property requires the following properties to also be set: ${missingProps.join(", ")}`;
  };

  return makeValidator(validationFn, this);
}

const name = (strings, fn, ...rest) => {
  if (!fn::is.func())
    throw new TypeError("expected first template interpolation to be a function");

  const name = fn.name::is.string() ? `\`${fn.name}\``: null;

  const result = [];
  let trimLeft = false;
  for (const str of fold(strings, [name, ...rest.map(v => v.toString())])) {
    if (str == null) trimLeft = true;
    else if (!trimLeft) result.push(str);
    else {
      result.push(str.startsWith(" ") ? str.substring(1) : str);
      trimLeft = false;
    }
  }
  return result.join("");
};