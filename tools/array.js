const { floor, random: randomNum } = Math;

/**
 * Shuffles this array.
 *
 * @export
 * @template T
 * @param {T[]} this This Array.
 * @returns {T[]} This array, with its elements shuffled.
 */
export function shuffle() {
  let currentIndex = this.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    randomIndex = floor(randomNum() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = this[currentIndex];
    this[currentIndex] = this[randomIndex];
    this[randomIndex] = temporaryValue;
  }

  return this;
}

/**
 * Selects a random element from this array.  Returns `undefined` if the array is empty.
 *
 * @export
 * @template T
 * @param {T[]} this This Array.
 * @returns {T | undefined} A random element of this array.
 */
export function randomElement() {
  const length = this.length;
  if (length === 0) return void 0;
  return this[floor(randomNum() * length)];
}