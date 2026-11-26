/** Returns a uniform random integer in [0, maxExclusive). */
export type RandomInt = (maxExclusive: number) => number;

/**
 * Uniform random integer from `crypto.getRandomValues` (browser and Node), with rejection
 * sampling so that no value is favoured by the modulo.
 */
export const secureRandomInt: RandomInt = (maxExclusive) => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError(`maxExclusive invalide : ${maxExclusive}`);
  }
  const range = 2 ** 32;
  const limit = range - (range % maxExclusive);
  const buffer = new Uint32Array(1);
  for (;;) {
    globalThis.crypto.getRandomValues(buffer);
    const value = buffer[0] ?? 0;
    if (value < limit) return value % maxExclusive;
  }
};

/**
 * Speaking order: a Fisher–Yates shuffle of `items` (a new array; the input is untouched).
 * Every permutation is equally likely with a uniform `randomInt`.
 */
export function drawOrder<T>(items: readonly T[], randomInt: RandomInt = secureRandomInt): T[] {
  const order = [...items];
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const a = order[i] as T;
    order[i] = order[j] as T;
    order[j] = a;
  }
  return order;
}
