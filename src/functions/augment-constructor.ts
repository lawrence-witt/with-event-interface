import attachEventListeners from "./attach-event-listeners";

import { createPropertyError, createTypeError } from "../factories/create-error";

import { chainIfPromise } from "../utilities/chain-if-promise";

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
  Circ extends KeyOfCirculars<InferPrototype<C>> | undefined,
  B extends KeyOfBuilders<C> | undefined,
>(
  constructor: C,
  listeners: L,
  circulars?: Exclude<Circ, undefined>[],
  builders?: Exclude<B, undefined>[],
  namespace?: N,
): AugmentedConstructor<C, L, Circ, B, N> {
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
      return chainIfPromise(original(...args), (res: InferPrototype<C>) => {
        return attachEventListeners(res, listeners, circulars, name);
      });
    }) as C[Exclude<B, undefined>];
  });

  return NewConstructor as AugmentedConstructor<C, L, Circ, B, N>;
}

export default augmentConstructor;
