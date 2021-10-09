import attachEventListeners from "./attach-event-listeners";
import augmentConstructor from "./augment-constructor";

import {
  Constructor,
  InferPrototype,
  ListenerBinding,
  KeyOfCirculars,
  KeyOfBuilders,
  EventInterfaceConstructor,
} from "../types";

function augmentEventListeners<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  Circ extends KeyOfCirculars<InferPrototype<C>> | undefined,
  B extends KeyOfBuilders<C> | undefined,
  N extends string = "listeners",
>(
  constructor: C,
  listeners: L,
  circulars?: Exclude<Circ, undefined>[],
  builders?: Exclude<B, undefined>[],
  namespace = "listeners" as N,
): EventInterfaceConstructor<C, L, Circ, B, N> {
  return class extends augmentConstructor(constructor, listeners, circulars, builders, namespace) {
    constructor(...args: any) {
      super(...args);
      attachEventListeners(this as InferPrototype<C>, listeners, circulars, namespace);
    }
  } as EventInterfaceConstructor<C, L, Circ, B, N>;
}

export default augmentEventListeners;
