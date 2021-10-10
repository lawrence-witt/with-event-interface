//eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createMockInstance = () => {
  const instance = {
    scopedString: "scopedString",
    circularMethod: () => {
      return instance;
    },
    syncMethod: (value: number) => {
      return value;
    },
    asyncMethod: async (value: number) => {
      return value;
    },
  };
  return instance;
};
