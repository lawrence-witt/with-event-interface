import attachEventListeners from "./attach-event-listeners";

import { createPropertyError, createTypeError } from "../factories/create-error";

import {
  Constructor,
  KeyOfCirculars,
  KeyOfBuilders,
  ListenerBinding,
  InferPrototype,
  AugmentedConstructor,
} from "../types";

function augmentConstructor<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  N extends string,
  PB extends KeyOfCirculars<InferPrototype<C>> | undefined,
  SB extends KeyOfBuilders<C> | undefined,
>(
  constructor: C,
  listeners: L,
  circulars?: Exclude<PB, undefined>[],
  builders?: Exclude<SB, undefined>[],
  namespace?: N,
): AugmentedConstructor<C, L, PB, SB, N> {
  const name = namespace || "listeners";

  class NewConstructor extends constructor {}

  builders?.forEach((key) => {
    if (!(key in NewConstructor)) {
      throw new Error(createPropertyError(key, "constructor", true));
    }

    const original = NewConstructor[key];

    if (typeof original !== "function") {
      throw new Error(createTypeError(key, "function", typeof original));
    }

    NewConstructor[key] = ((...args: []) => {
      const build = original(...args);

      if (typeof build?.then === "function") {
        return build.then((instance: InferPrototype<C>) => {
          return attachEventListeners(instance, listeners, circulars, name);
        });
      } else {
        return attachEventListeners(build as InferPrototype<C>, listeners, circulars, name);
      }
    }) as unknown as C[Exclude<SB, undefined>];
  });

  return NewConstructor as AugmentedConstructor<C, L, PB, SB, N>;
}

export default augmentConstructor;
