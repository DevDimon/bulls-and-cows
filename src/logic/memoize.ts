export const memoize = <Args extends unknown[], R>(
  fn: (...args: Args) => R,
): ((...args: Args) => R) => {
  const cache = new Map<string, R>();
  return (...args: Args): R => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key) as R;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};
