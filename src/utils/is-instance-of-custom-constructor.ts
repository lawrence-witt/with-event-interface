export const isInstanceOfCustomConstructor = (control: unknown, test: unknown): boolean => {
  return Boolean(
    control &&
      test &&
      typeof control === "object" &&
      typeof test === "object" &&
      control.constructor !== Object &&
      test.constructor !== Object &&
      test instanceof control.constructor,
  );
};
