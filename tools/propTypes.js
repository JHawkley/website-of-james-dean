import { is } from "tools/common";

/** @module tools/propTypes */

// Re-export extension methods.
export * as extensions from "tools/extensions/propTypes";

export function validateAll(propTypes) {

  const validator = (...args) => {
    const [propValue, key, componentName, location, propFullName] = args;
    const value = propValue[key];

    if (value::is.undefined()) return;

    for (const ptFn of propTypes) {
      const result = ptFn(...args);

      if (result == null) continue;
      if (result::is.instanceOf(Error)) return result;

      return new ValidationError(componentName, location, propFullName, [
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
  requirement == null || requirement::is.boolean() || requirement::is.func() || throw new TypeError(
    `invalid argument for \`requirement\`; got ${requirement}`
  );

  const validator = (...args) => {
    const [propValue, key, componentName, location, propFullName] = args;

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
          const result = requirement(...args);
          if (result != null) return result;
        }
        if (valueIsMissing) return;
    }

    try {
      const result = validationFn(value, key, propValue);

      switch (true) {
        case result == null:
          return;
        case result::is.string():
        case result::is.array():
          return new ValidationError(componentName, location, propFullName, result);
        default:
          return new ValidationError(componentName, location, propFullName, [
            "expected the validation function to return `undefined`, `null`, a string, or an array",
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
    const [
      propValue, key, // eslint-disable-line no-unused-vars
      componentName, location, propFullName
    ] = args;

    const value = propValue[key];

    if (value == null)
      return ValidationError.required(componentName, location, propFullName, value);
  
    return validator(...args);
  }
}

export class ValidationError extends Error {

  static required(componentName, location, propFullName, ...maybeValue) {
    const msgs = ["this property is marked as required"];

    if (maybeValue.length > 0) {
      const value = maybeValue[0];
      if (value::is.undefined()) msgs.push("got `undefined`");
      else if (value::is.null()) msgs.push("got `null`");
    }

    return new ValidationError(componentName, location, propFullName, msgs);
  }

  constructor(componentName, location, propFullName, msg, innerError, ...errorArgs) {
    const msgs = [`invalid ${location} \`${propFullName}\` supplied to \`${componentName}\``];
    if (msg::is.array()) msgs.push(...msg);
    else if (msg::is.string()) msgs.push(msg);

    super(msgs.join("; "), ...errorArgs);
    Error.captureStackTrace?.(this, ValidationError);
    this.innerError = innerError;
  }

}

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