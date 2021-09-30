import attachEventListeners from "./attach-event-listeners";
import augmentConstructor from "./augment-constructor";

import {
  Constructor,
  InferPrototype,
  ListenerBinding,
  BuilderKeys,
  EventInterfaceConstructor,
  EventInterfaceBuilderConstructor,
} from "../types";

export default function augmentEventListeners<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  B extends undefined,
  N extends string = "listeners",
>(constructor: C, listeners: L, builders?: B, namespace?: N): EventInterfaceConstructor<C, L, N>;

export default function augmentEventListeners<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  B extends BuilderKeys<C>,
  N extends string = "listeners",
>(
  constructor: C,
  listeners: L,
  builders: [...B[]],
  namespace?: N,
): EventInterfaceBuilderConstructor<C, L, B, N>;

export default function augmentEventListeners<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  N extends string,
  B extends BuilderKeys<C>,
>(constructor: C, listeners: L, builders?: [...B[]], namespace?: N): unknown {
  return class extends (builders
    ? augmentConstructor(constructor, listeners, builders, namespace)
    : constructor) {
    constructor(...args: any[]) {
      super(...args);
      attachEventListeners(this as InferPrototype<C>, listeners, namespace || "listeners");
    }
  };
}
