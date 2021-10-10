export const omitEventInterface = <T extends { [key: string]: any }, N extends string>(
  instance: T,
  namespace: N,
): Omit<T, N | "addEventListener" | "removeEventListener"> => {
  [namespace, "addEventListener", "removeEventListener"].forEach((name) => {
    if (name in instance) delete instance[name];
  });

  return instance;
};
