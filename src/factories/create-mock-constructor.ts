//eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createMockConstructor = () => {
  return class Mock {
    static staticProperty = "staticString";
    stringProperty = "scopedString";

    static syncBuild() {
      return new Mock();
    }

    static async asyncBuild() {
      return new Mock();
    }

    syncMethodProperty(value: number) {
      return [value, this.stringProperty];
    }

    async asyncMethodProperty(value: number) {
      return [value, this.stringProperty];
    }
  };
};
