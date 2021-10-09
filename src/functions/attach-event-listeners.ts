import { createPropertyError, createTypeError } from "../factories/create-error";

import { isEventInterface } from "../utils/is-event-interface";
import { chainIfPromise } from "../utils/chain-if-promise";

import { KeyOfCirculars, ListenerTuple, ListenerBinding, EventInterfaceInstance } from "../types";

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
  if (isEventInterface(instance, listeners, circulars, namespace)) return instance;

  const name = namespace as "listeners";

  [name, "addEventListener", "removeEventListener"].forEach((prop) => {
    if (prop in instance) throw new Error(createPropertyError(prop, "object", false));
  });

  const withState = Object.assign(instance, { [name]: new Map<string, ListenerTuple[]>() });

  Object.entries(listeners).forEach(([type, method]) => {
    if (!((method as PropertyKey) in withState)) {
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
          attachEventListeners(res as T, listeners, circulars, name);
        }
        onEnd.forEach((tuple) => tuple[0](res));
        return res;
      });
    }) as typeof withState[typeof method];

    withState[name].set(type, []);
  });

  circulars?.forEach((circular) => {
    if (Object.values(listeners).includes(circular)) return;

    const original = withState[circular].bind(withState);

    withState[circular] = ((...args: any) => {
      return chainIfPromise(original(...args), (res: T) => {
        return attachEventListeners(res, listeners, circulars, name);
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
