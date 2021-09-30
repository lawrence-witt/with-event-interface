import attachEventListeners from "./attach-event-listeners";

import {
  Constructor,
  ListenerBinding,
  InferPrototype,
  BuilderKeys,
  AugmentBuilderKeys,
} from "../types";

export default function augmentConstructor<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  N extends string,
  B extends BuilderKeys<C>,
>(
  constructor: C,
  listeners: ListenerBinding<InferPrototype<C>>,
  builders: [...B[]],
  namespace?: N,
): AugmentBuilderKeys<C, L, B, N> {
  const name = namespace || "listeners";

  class AugmentedConstructor extends constructor {}

  builders.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(AugmentedConstructor, key)) return;

    const original = AugmentedConstructor[key];

    if (typeof original !== "function") return;

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
