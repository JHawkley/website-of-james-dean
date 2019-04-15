import isSimpleObject from "tools/extensions/common/isSimpleObject";

const referenceTypes = ["object", "function"];

function _string() { "use strict"; return typeof this === "string"; }

function _array() { "use strict"; return Array.isArray(this); }

function _number() { "use strict"; return typeof this === "number"; }

function _func() { "use strict"; return typeof this === "function"; }

function _symbol() { "use strict"; return typeof this === "symbol"; }

function _boolean() { "use strict"; return typeof this === "boolean"; }

function _defined() { "use strict"; return this != null; }

function _undefined() { "use strict"; return typeof this === "undefined"; }

function _null() { "use strict"; return this === null; }

function _finite() { "use strict"; return Number.isFinite(this); }

function _NaN() { "use strict"; return typeof this !== "number" || Number.isNaN(this); }

function _object() { "use strict"; return this != null && typeof this === "object"; }

function _dict() { "use strict"; return this != null && isSimpleObject(this); }

function _error() { "use strict"; return this instanceof Error; }

function _refType() { "useStrict"; return referenceTypes.includes(typeof this); }

function _valueType() { "useStrict"; return !referenceTypes.includes(typeof this); }

function _instanceOf(klass) { "use strict"; return this instanceof klass; }

function _that(other) { "use strict"; return Object.is(this, other); }

function _in(values) { "use strict"; return values.includes(this); }

export {
  _string as string,
  _array as array,
  _number as number,
  _func as func,
  _symbol as symbol,
  _boolean as boolean,
  _defined as defined,
  _undefined as undefined,
  _null as null,
  _finite as finite,
  _NaN as NaN,
  _object as object,
  _dict as dict,
  _error as error,
  _refType as refType,
  _valueType as valueType,
  _instanceOf as instanceOf,
  _that as that,
  _in as in
};