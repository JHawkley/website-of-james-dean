export default function isSimpleObject(obj) {
  if (obj == null) return false;

  switch (Object.getPrototypeOf(obj)) {
    case Object.prototype: return true;
    case null: return true;
    default: return false;
  }
}