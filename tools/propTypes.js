import OriginalPropTypes from "prop-types";
import BadArgumentError from "lib/BadArgumentError";
import InnerError from "lib/InnerError";
import { is } from "tools/common";

/** @module tools/propTypes */

// Re-export extension methods.
export * as extensions from "tools/extensions/propTypes";

export function validateAll(propTypes) {
  if (!propTypes::is.array())
    throw new BadArgumentError("must be an array", "propTypes", propTypes);

  const validator = (...args) => {
    for (const ptFn of propTypes) {
      const result = ptFn(...args);

      if (result == null) continue;
      if (result::is.instanceOf(Error)) return result;

      const [key, componentName, location, propFullName] = args.slice(1);
      return new ValidationError(componentName, location, propFullName ?? key, [
        "expected a validator to only return `undefined`, `null`, or an error instance",
        `got \`${result}\``
      ]);
    }
  };

  validator.isRequired = makeRequiredValidator(validator);
  
  return validator;
}

export function makeValidator(validationFn, requirement) {
  // Validating `requirement` using a throw-expression.
  requirement == null || requirement::is.boolean() || requirement::is.func() || throw new BadArgumentError(
    "must be `null`, `undefined`, a boolean, or a function", "requirement", requirement
  );

  const validator = (propValue, key, componentName, location, propFullName, ...rest) => {
    // Massage some of the arguments a little.
    componentName = componentName ?? "(anonymous component)";
    propFullName = propFullName ?? key;

    // The `rest` arg likely contains the super-secret-do-not-expose-or-be-fired argument.
    // They use this argument to enforce proper calling of validators.
    const validatorArgs = [propValue, key, componentName, location, propFullName, ...rest];
    const value = propValue[key];
    const valueIsMissing = value == null;

    switch (true) {
      // `validationFn` will perform this check itself.
      case requirement === false && valueIsMissing:
        break;
      // `validationFn` always requires the value be present.
      case requirement === true && valueIsMissing:
        return ValidationError.required(componentName, location, propFullName, value);
      default:
        // Defer to the `requirement` function.
        if (requirement::is.func()) {
          const result = requirement(...validatorArgs);
          if (result != null) return result;
        }
        if (valueIsMissing) return;
    }

    try {
      const result = validationFn(value, key, propValue, validatorArgs);

      switch (true) {
        case result == null:
          return;
        case result::is.error():
          return result;
        case result::is.string():
        case result::is.array():
          return new ValidationError(componentName, location, propFullName, result);
        default:
          return new ValidationError(componentName, location, propFullName, [
            "expected the validation function to return `undefined`, `null`, an Error instance, a string, or an array",
            `got \`${result}\``
          ]);
      }
    }
    catch (ex) {
      return new ValidationError(
        componentName, location, propFullName,
        ["the validation function threw an error while running", "check `innerError` for more information"],
        ex
      );
    }
  };

  validator.isRequired = requirement::is.boolean() ? validator : makeRequiredValidator(validator);

  return validator;
}

export function makeRequiredValidator(validator) {
  return function isRequired(...args) {
    const [propValue, key, componentName, location, propFullName] = args;

    const value = propValue[key];

    if (value == null)
      return ValidationError.required(componentName, location, propFullName ?? key, value);
  
    return validator(...args);
  }
}

export class ValidationError extends InnerError {

  static required(componentName, location, propFullName, ...maybeValue) {
    const msgs = ["this property is marked as required"];

    if (maybeValue.length > 0) {
      const value = maybeValue[0];
      if (value::is.undefined()) msgs.push("got `undefined`");
      else if (value::is.null()) msgs.push("got `null`");
    }

    return new ValidationError(componentName, location, propFullName, msgs);
  }

  constructor(componentName, location, propFullName, msg, innerError) {
    const msgs = [`invalid ${location} \`${propFullName}\` supplied to \`${componentName}\``];
    if (msg::is.array()) msgs.push(...msg);
    else if (msg::is.string()) msgs.push(msg);

    super(msgs.join("; "), innerError);
    this.innerError = innerError;
  }

}

/**
 * An augmented version of the prop-types provided by the `prop-types` module.
 */
export default Object.assign(
  {}, OriginalPropTypes, {
    /**
     * A prop-type that asserts that the property must not be set to anything; only accepts `null`
     * and `undefined`.  Handy when extending a component and you want to make clear the property
     * is not supported.
     * 
     * @type {Validator}
     */
    unset: makeValidator(
      (value) => value == null ? null : "this property is not supported",
      false
    ),
    /**
     * A prop-type that asserts that the property must be on the `props` object as an own-property,
     * even if it is set to `undefined` or `null`.
     * 
     * @type {Validator}
     */
    hasOwn: makeValidator(
      (value, key, props) => {
        if (Object.prototype.hasOwnProperty.call(props, key)) return null;
        return "this property must be provided, even if it is set to `undefined` or `null`";
      },
      false
    ),
    /**
     * A prop-type that asserts that a property is set to an exact value.  Best used with value-types
     * and `Symbol`.  The comparison is carried out with `Object.is`.
     * 
     * @param {*} value The value required.
     * @returns {Validator}
     * @throws When no arguments were provided.
     * @throws When more than one argument was provided.
     */
    exactly(value) {
      if (arguments.length !== 1)
        throw new BadArgumentError("must provide exactly one argument", "value", void 0);
      
      return makeValidator(
        (propValue) => Object.is(value, propValue) ? null : `must be the exact value: \`${value}\``,
        false
      )
    }
  }
);

/**
 * @callback Validator
 * @param {any} propValue The `props` object being validated.
 * @param {string} key The key of the property being validated.
 * @param {string} componentName The name of the component.
 * @param {string} location The location.
 * @param {string} propFullName The full name of the property.
 * @returns {void|Error} An error, in the case the validation failed.
 */

/**
 * A callback for any predicate function used as a custom PropType validator.
 * 
 * @callback PredicateFunction
 * @param {any} value The value of the property.
 * @param {string} key The name of the property.
 * @param {Object.<string, any>} props The props object of the React element.
 * @returns {boolean|string|string[]} Whether the value passed validation or a string describing an error.
 */