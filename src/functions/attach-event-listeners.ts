import { createPropertyError, createTypeError } from "../factories/create-error";

import { isEventInterface } from "../utilities/is-event-interface";
import { chainIfPromise } from "../utilities/chain-if-promise";

import {
  KeyOfCirculars,
  ListenerTuple,
  ListenerMap,
  ListenerBinding,
  EventInterfaceInstance,
} from "../types";

function attachEventListeners<
  T extends { [key: PropertyKey]: any },
  L extends ListenerBinding<T>,
  C extends KeyOfCirculars<T> | undefined,
  N extends string = "listeners",
>(
  instance: T,
  listeners: L,
  circulars?: Exclude<C, undefined>[],
  namespace = "listeners" as N,
): EventInterfaceInstance<T, L, C, N> {
  const name = namespace as "listeners";

  if (isEventInterface(instance, listeners, circulars, namespace)) return instance;

  if (name in instance) {
    throw new Error(createPropertyError(name, "object", false));
  }

  if ("addEventListener" in instance) {
    throw new Error(createPropertyError("addEventListener", "object", false));
  }

  if ("removeEventListener" in instance) {
    throw new Error(createPropertyError("removeEventListener", "object", false));
  }

  const withState = Object.assign(instance, { [name]: new Map() as ListenerMap });

  Object.entries(listeners).forEach(([type, method]) => {
    if (typeof method !== "string") {
      throw new Error("Method name must be a string.");
    }

    if (!(method in withState)) {
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

      return chainIfPromise(original(...args), (res) => {
        if (circulars?.includes(method as Exclude<C, undefined>)) {
          attachEventListeners(res as T, listeners, circulars, namespace);
        }
        onEnd.forEach((tuple) => tuple[0](res));
        return res;
      });
    }) as typeof withState[typeof method];

    withState[namespace].set(type, []);
  });

  circulars?.forEach((circular) => {
    if (Object.values(listeners).includes(circular)) return;

    const original = withState[circular].bind(withState);

    withState[circular] = ((...args: any) => {
      return chainIfPromise(original(...args), (res: T) => {
        return attachEventListeners(res, listeners, circulars, namespace);
      });
    }) as typeof withState[typeof circular];
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

  return withMethods as unknown as EventInterfaceInstance<T, L, C, N>;
}

export default attachEventListeners;
