import { createPropertyError, createTypeError } from "../factories/create-error";

import { isEventInterface } from "../utils/is-event-interface";
import { chainIfPromise } from "../utils/chain-if-promise";

import {
  AnyObject,
  ReservedProperties,
  ListenerTuple,
  ListenerBinding,
  EventInterfaceInstance,
} from "../types";

export function attachEventInterface<
  T extends AnyObject,
  L extends ListenerBinding<T>,
  N extends string = "listeners",
>(
  instance: T extends ReservedProperties<N> ? never : T,
  listeners: L,
  namespace = "listeners" as N,
): EventInterfaceInstance<T, L, N> {
  if (isEventInterface(instance)) return instance;

  const name = namespace as "listeners";

  [name, "addEventListener", "removeEventListener"].forEach((prop) => {
    if (prop in instance) throw new Error(createPropertyError(prop, "object", false));
  });

  const withState = Object.assign(instance, { [name]: new Map<string, ListenerTuple[]>() });

  Object.entries(listeners).forEach(([type, method]) => {
    if (!withState[method]) {
      throw new Error(createPropertyError(method, "object", true));
    }

    if (typeof withState[method] !== "function") {
      throw new Error(createTypeError(method, "function", typeof withState[method]));
    }

    const original = withState[method].bind(withState);

    withState[method] = ((...args: any) => {
      const callbacks = withState[name].get(type);

      if (!callbacks) return original(...args);

      const [onEnd, onStart] = callbacks.reduce(
        (out: [ListenerTuple[], ListenerTuple[]], tuple) => {
          out[+tuple[1]].push(tuple);
          return out;
        },
        [[], []],
      );

      onStart.forEach((tuple) => tuple[0]());

      return chainIfPromise(original(...args), (res: unknown) => {
        onEnd.forEach((tuple) => tuple[0](res));
        return res;
      });
    }) as typeof withState[typeof method];

    withState[name].set(type, []);

    Object.defineProperty(withState[method], "name", { value: method });
  });

  const withMethods = Object.assign(withState, {
    addEventListener: (type: string, listener: (...args: any) => any, onStart = false) => {
      const callbacks = withState[name].get(type);
      if (!callbacks) return;
      withState[name].set(type, [...callbacks, [listener, onStart]]);
    },
    removeEventListener: (type: string, listener: (...args: any) => any) => {
      const callbacks = withState[name].get(type);
      if (!callbacks) return;
      withState[name].set(
        type,
        callbacks.filter((l) => l[0] !== listener),
      );
    },
  });

  return withMethods;
}
