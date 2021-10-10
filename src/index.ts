import { attachEventInterface } from "./functions/attach-event-interface";
import { augmentEventInterface } from "./functions/augment-event-interface";

export * from "./types";

export { attachEventInterface, augmentEventInterface };

const obj = {
  meth: () => {
    return obj;
  },
};

class MyClass {
  meth() {
    return 42;
  }
  circular() {
    return this;
  }
}

const augmented = augmentEventInterface(MyClass, { test: "meth" }, ["circular"]);
