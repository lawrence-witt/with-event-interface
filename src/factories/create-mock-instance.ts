export const createMockInstance = () => ({
  stringProperty: "scopedString",
  syncMethodProperty: (value: number) => {
    return value;
  },
  asyncMethodProperty: async (value: number) => {
    return value;
  },
});
