/**
 * A class to aid object composition.
 *
 * @export
 * @class Composition
 */
export default class Composition {

  /**
   * Creates an instance of Composition.
   * 
   * @param {Object.<string, any>} [start=null] An object to clone, to act as the start of the composition.
   * @memberof Composition
   */
  constructor(start = null) {
    /**
     * Whether any composition has occurred.  Will only be `false` if a `start` was not provided and no
     * other composition operations have occurred.
     * 
     * @property {boolean} composed
     * @memberof Composition
     * @instance
     */
    this.composed = Boolean(start);

    /**
     * The current result of the composition.
     * 
     * @property {boolean} result
     * @memberof Composition
     * @instance
     */
    this.result = start ? Object.assign({}, start) : {};
  }

  /**
   * Adds the own-properties of the given object to the composition.
   *
   * @param {Object.<string, any>} source
   * @returns {this}
   * @memberof Composition
   */
  compose(source) {
    this.composed = true;
    Object.assign(this.result, source);
    return this;
  }

  /**
   * Assigns the given `value` to the property identified by the given `key` to the composition.
   *
   * @param {string} key The key of the property.
   * @param {any} value The value of the property.
   * @returns {this}
   * @memberof Composition
   */
  add(key, value) {
    this.composed = true;
    this.result[key] = value;
    return this;
  }

  /**
   * Removes the property identified by the given `key` from the composition.
   *
   * @param {string} key
   * @returns {this}
   * @memberof Composition
   */
  delete(key) {
    this.composed = true;
    delete this.result[key];
    return this;
  }

}