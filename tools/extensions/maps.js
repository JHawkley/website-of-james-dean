export function map(fn) {
  const result = new Map();
  for (const kvp of this)
    result.set(...fn(kvp));
  return result;
}

export function mapValues(fn) {
  const result = new Map();
  for (const [key, value] of this)
    result.set(key, fn(value));
  return result;
}

export function mapToArray(fn) {
  const result = [];
  for (const kvp of this)
    result.push(fn(kvp));
  return result;
}