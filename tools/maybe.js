import { dew } from "./common";


const maybe = dew(() => {
  const nothing = Object.freeze([]);
  const one = (value) => Object.freeze([value]);
  const some = (...values) => values.length > 0 ? Object.freeze(values) : nothing;

  const fn = (...values) => {
    if (values.length === 0)
      return nothing;
    if (values.length === 1)
      return values[0] != null ? Object.freeze(values) : nothing;
    return some(...values.filter(v => v != null));
  };

  return Object.freeze(Object.assign(fn, { nothing, one, some }));
});

export function firstOrElse(defaultValue) {
  if (this.length > 0)
    return this[0];

  if (typeof defaultValue === "function")
    return defaultValue();
  return defaultValue;
}

export function map(xformFn) {
  return this.length > 0 ? Object.freeze(this.map(xformFn)) : maybe.nothing;
}

export default maybe;