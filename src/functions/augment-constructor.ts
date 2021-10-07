import attachEventListeners from "./attach-event-listeners";

import { createPropertyError, createTypeError } from "../factories/create-error";

import {
  Constructor,
  ListenerBinding,
  InferPrototype,
  BuilderKeys,
  AugmentBuilderKeys,
} from "../types";

function augmentConstructor<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  N extends string,
  B extends BuilderKeys<C>,
>(constructor: C, listeners: L, builders: [...B[]], namespace?: N): AugmentBuilderKeys<C, L, B, N> {
  const name = namespace || "listeners";

  class AugmentedConstructor extends constructor {}

  builders.forEach((key) => {
    if (!(key in AugmentedConstructor)) {
      throw new Error(createPropertyError(key, "constructor", true));
    }

    const original = AugmentedConstructor[key];

    if (typeof original !== "function") {
      throw new Error(createTypeError(key, "function", typeof original));
    }

    AugmentedConstructor[key] = ((...args: []) => {
      const build = original(...args);

      if (typeof build?.then === "function") {
        return build.then((instance: any) => {
          return attachEventListeners(instance, listeners, name);
        });
      } else {
        return attachEventListeners(build, listeners, name);
      }
    }) as unknown as C[B];
  });

  return AugmentedConstructor;
}

export default augmentConstructor;
