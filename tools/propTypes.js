import React from "react";
import PropTypes from "prop-types";
import flattenChildren from "react-flatten-children";
import BadArgumentError from "lib/BadArgumentError";
import InnerError from "lib/InnerError";
import { is } from "tools/common";
import { collectFirstProp } from "tools/extensions/common";
import { collectFirst } from "tools/extensions/array";

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
  {}, PropTypes, {
    /**
     * Almost identical to `PropTypes.shape` except that it does not test the prop's value to see
     * if it is an `Object`.  This allows you test function types with it as well.
     * 
     * It will still reject if the given object is any value-type, however.
     * 
     * @param {Object.<string, Validator>} shapeDef An object where property-keys map to validators.
     * @returns {Validator}
     */
    anyShape(shapeDef) {
      return makeValidator(
        (value, key, props, validatorArgs) => {
          if (value::is.valueType())
            return "cannot be a value-type";
          
          return shapeDef::collectFirstProp((keyName, validator) => {
            return applyValidator(validator, validatorArgs, value, keyName, `.${keyName}`) ?? void 0;
          });
        },
        false
      )
    },
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
     * If `value` happens to be `undefined` or `null`, then use of `isRequired` will have no effect.
     * 
     * @param {*} value The value required.
     * @returns {Validator}
     */
    exactly(value) {
      return makeValidator(
        (propValue) => Object.is(value, propValue) ? null : `must be the exact value: \`${value}\``,
        !value::is.defined()
      )
    },
    /**
     * A prop-type for validating the shape of the React element of a component's children.  If `childTypes`
     * is not provided, the prop-type will act as `PropTypes.node`.
     * 
     * Unlike `PropTypes.node`, both the `type` and `props` of the child element may be tested through a
     * `PropTypes.shape` validator.
     * 
     * @param {Validator[]} [childTypes] An array of validators to apply to each child React element.
     * @returns {Validator}
     */
    children(childTypes) {
      return makeValidator(
        (value, key, props, validatorArgs) => {
          if (key !== "children")
            return "improper usage of prop-type; only supports checking the `children` property";
          
          if (!childTypes)
            return PropTypes.node(...validatorArgs);
          
          const children = React.Children.toArray(value);
          const childValidator = PropTypes.oneOfType(childTypes);
          return iterChildren(children, childValidator, validatorArgs);
        },
        false
      )
    },
    /**
     * A prop-type for validating the shape of the React element of a component's children.  If `childTypes`
     * is not provided, the prop-type will act as `PropTypes.node`.
     * 
     * Unlike `PropTypes.node`, both the `type` and `props` of the child element may be tested through a
     * `PropTypes.shape` validator.
     * 
     * This variation flattens `React.Fragment` children before validating.
     * 
     * @param {Validator[]} [childTypes] An array of validators to apply to each child React element.
     * @returns {Validator}
     */
    flatChildren(childTypes) {
      return makeValidator(
        (value, key, props, validatorArgs) => {
          if (key !== "children")
            return "improper usage of prop-type; only supports checking the `children` property";
          
          if (!childTypes)
            return PropTypes.node(...validatorArgs);
          
          const children = flattenChildren(value);
          const childValidator = PropTypes.oneOfType(childTypes);
          return iterChildren(children, childValidator, validatorArgs);
        },
        false
      )
    }
  }
);

const iterChildren = (children, childValidator, validatorArgs) => {
  return children::collectFirst((child, i) => {
    return applyValidator(childValidator, validatorArgs, children, i, `[${i}]`) ?? void 0;
  });
};

const applyValidator = (validator, validatorArgs, value, key, propNamePostfix = null) => {
  const [,, componentName, location, propFullName, ...restArgs] = validatorArgs;
  const newFullName = propNamePostfix ? `${propFullName}${propNamePostfix}` : propFullName;
  return validator(value, key, componentName, location, newFullName, ...restArgs);
};

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