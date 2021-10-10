export const chainIfPromise = <T, R>(
  target: Promise<any> | any,
  fn: (result: T) => R,
): Promise<R> | R => {
  if (target instanceof Promise || typeof target?.then === "function")
    return target.then((res: T) => fn(res));
  return fn(target);
};
