import React from "react";
import PropTypes from "prop-types";
import { is } from "tools/common";
import { extensions as arrEx, fold } from "tools/array";
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
 * Adds an expectation to this validator that when this property is available, the properties listed in
 * `propKeys` must also be available.
 * 
 * The `strictOther` and `strictSelf` arguments modify what it means to be available.  A value handled
 * strictly must not only be set, but also truthy or otherwise non-empty, to be considered available.
 * 
 * Note: the "children" property will always be handled strictly.
 *
 * @export
 * @this {module:tools/propTypes.Validator}
 * @param {string[]} propKeys The list of property keys to require.
 * @param {boolean} [strictOther=true]
 *   Whether properties from the `propKeys` list should be treated strictly.
 * @param {boolean} [strictSelf]
 *   Whether the value of this property should be treated strictly.  Defaults to `true` when this
 *   property's value is `boolean` and `false` otherwise.
 * @returns {module:tools/propTypes.Validator} A prop-type validator function.
 */
export function dependsOn(propKeys, strictOther = true, strictSelf) {
  if (!this::is.func())
    throw new TypeError("expected to be bound to a prop-type validator function");
  
  if (propKeys::is.string())
    propKeys = [propKeys];

  if (!propKeys::is.array())
    throw new TypeError("invalid argument for `propKeys`; expected either a string or an array-of-strings");
  else if (!propKeys.every(v => v::is.string()))
    throw new TypeError("invalid argument for `propKeys`; when an array, it can only contain strings");

  if (strictOther != null && !strictOther::is.boolean())
    throw new TypeError("invalid argument for `strictOther`; expected a boolean or `null`");
  
  if (strictSelf != null && !strictSelf::is.boolean())
    throw new TypeError("invalid argument for `strictSelf`; expected a boolean or `null`");

  const makeMsg = (key, exclusiveProps) => {
    const start = `the \`${key}\` property requires the following properties to be`;
    const conditions = strictOther ? "set, a truthy-value, or otherwise not-empty": "set";
    return `${start} ${conditions}: ${exclusiveProps.join(", ")}`;
  }

  const validationFn = (ownValue, key, props, typeCheckArgs) => {
    const ownPreds = predicatesFor(key, ownValue, strictSelf ?? ownValue::is.boolean());
    if (ownPreds.some(fn => fn(ownValue))) return;

    const missingProps = propKeys::arrEx.collect((k) => {
      const otherValue = props[k];
      const otherPreds = predicatesFor(k, otherValue, strictOther);
      return otherPreds.some(fn => fn(props[k])) ? `\`${k}\`` : void 0;
    });
    
    if (missingProps.length === 0) return this(...typeCheckArgs);

    return makeMsg(key, missingProps);
  };

  return makeValidator(validationFn, false);
}

/**
 * Adds an expectation to this validator that when this property is available, the properties listed in
 * `propKeys` must not be available.
 * 
 * The `strictOther` and `strictSelf` arguments modify what it means to be available.  A value handled
 * strictly must not only be set, but also truthy or otherwise non-empty, to be considered available.
 * 
 * Note: the "children" property will always be handled strictly.
 *
 * @export
 * @this {module:tools/propTypes.Validator}
 * @param {string[]} propKeys The list of property keys to be exclusive to.
 * @param {boolean} [strictOther=true]
 *   Whether properties from the `propKeys` list should be treated strictly.
 * @param {boolean} [strictSelf]
 *   Whether the value of this property should be treated strictly.  Defaults to `true` when this
 *   property's value is `boolean` and `false` otherwise.
 * @returns {module:tools/propTypes.Validator} A prop-type validator function.
 */
export function exclusiveTo(propKeys, strictOther = true, strictSelf) {
  if (!this::is.func())
    throw new TypeError("expected to be bound to a prop-type validator function");
  
  if (propKeys::is.string())
    propKeys = [propKeys];

  if (!propKeys::is.array())
    throw new TypeError("invalid argument for `propKeys`; expected either a string or an array-of-strings");
  else if (!propKeys.every(v => v::is.string()))
    throw new TypeError("invalid argument for `propKeys`; when an array, it can only contain strings");

  if (strictOther != null && !strictOther::is.boolean())
    throw new TypeError("invalid argument for `strictOther`; expected a boolean or `null`");
  
  if (strictSelf != null && !strictSelf::is.boolean())
    throw new TypeError("invalid argument for `strictSelf`; expected a boolean or `null`");

  const makeMsg = (key, exclusiveProps) => {
    const start = `the \`${key}\` property requires the following properties to be`;
    const conditions = strictOther ? "unset, a falsy-value, or otherwise empty": "unset";
    return `${start} ${conditions}: ${exclusiveProps.join(", ")}`;
  }

  const validationFn = (ownValue, key, props, typeCheckArgs) => {
    const ownPreds = predicatesFor(key, ownValue, strictSelf ?? ownValue::is.boolean());
    if (ownPreds.some(fn => fn(ownValue))) return;
    
    const exclusiveProps = propKeys::arrEx.collect((k) => {
      const otherValue = props[k];
      const otherPreds = predicatesFor(k, otherValue, strictOther);
      return otherPreds.every(fn => fn(otherValue)) ? void 0 : `\`${k}\``;
    });
    
    if (exclusiveProps.length === 0) return this(...typeCheckArgs);

    return makeMsg(key, exclusiveProps);
  };

  return makeValidator(validationFn, false);
}

/**
 * Adds an expectation that this validator that a value cannot be an empty-string or empty array.
 *
 * @export
 * @this {module:tools/propTypes.Validator}
 * @returns {module:tools/propTypes.Validator} A prop-type validator function.
 */
export function notEmpty() {
  if (!this::is.func())
    throw new TypeError("expected to be bound to a prop-type validator function");
  
  const validationFn = (value) => {
    if (isEmptyString(value)) return "string may not be empty";
    if (isEmptyArray(value)) return "array may not be empty";
  };

  return makeValidator(validationFn, this);
}

const isUnset = (v) => v == null;
const isFalse = (v) => v === false;
const isEmptyString = (v) => v === "";
const isEmptyArray = (v) => v.length === 0;
const isEmptyChildren = (v) => !React.Children.count(v);

const predicatesFor = (key, value, strict) => {
  if (key === "children") return [isEmptyChildren];
  if (!strict) return [isUnset];
  
  switch (true) {
    case value::is.boolean(): return [isUnset, isFalse];
    case value::is.string(): return [isUnset, isEmptyString];
    case value::is.array(): return [isUnset, isEmptyArray];
    default: return [isUnset];
  }
};

const name = (strings, fn, ...rest) => {
  if (!fn::is.func())
    throw new TypeError("expected first template interpolation to be a function");

  const name = fn.name && fn.name::is.string() ? `\`${fn.name}\``: null;

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