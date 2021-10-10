import { createPropertyError } from "../factories/create-error";
import { createListenerState } from "../factories/create-listener-state";

import { isEventInterface } from "../utils/is-event-interface";
import { isSameEventInterface } from "../utils/is-same-event-interface";
import { chainIfPromise } from "../utils/chain-if-promise";
import { userFunctions } from "../utils/user-functions";

import {
  AnyObject,
  KeyOfCirculars,
  ListenerTuple,
  ListenerBinding,
  EventInterfaceInstance,
} from "../types";
import { omitEventInterface } from "../utils/omit-event-interface";

export function attachEventInterface<
  T extends AnyObject,
  L extends ListenerBinding<T>,
  C extends KeyOfCirculars<T> | undefined,
  N extends string = "listeners",
>(
  instance: T,
  listeners: L,
  circulars?: Exclude<C, undefined>[],
  namespace = "listeners" as N,
): EventInterfaceInstance<T, L, C, N> {
  if (isEventInterface(instance, namespace)) return instance;

  const name = namespace as "listeners";

  [name, "addEventListener", "removeEventListener"].forEach((prop) => {
    if (prop in instance) throw new Error(createPropertyError(prop, "object", false));
  });

  const withState = Object.assign(instance, { [name]: createListenerState() });

  const listenerEntries = Object.entries(listeners);

  userFunctions(withState).forEach((key: keyof typeof withState) => {
    if (typeof withState[key] !== "function") return;

    const original = withState[key].bind(withState);

    const listener = listenerEntries.find((entry) => entry[1] === key);

    withState[key] = ((...args: any) => {
      if (!listener) {
        return chainIfPromise(original(...args), (res: any) => {
          if (circulars?.includes(key as Exclude<C, undefined>)) {
            return attachEventInterface(res, listeners, circulars, name);
          } else if (isSameEventInterface(res, withState, name)) {
            return omitEventInterface(res, name);
          }

          return res;
        });
      }

      const callbacks = withState[name].map.get(listener[0]);

      if (!callbacks) return original(...args);

      const [onEnd, onStart] = callbacks.reduce(
        (out: [ListenerTuple[], ListenerTuple[]], tuple) => {
          out[+tuple[1]].push(tuple);
          return out;
        },
        [[], []],
      );

      onStart.forEach((tuple) => tuple[0]());

      return chainIfPromise(original(...args), (res: any) => {
        if (circulars?.includes(key as Exclude<C, undefined>)) {
          res = attachEventInterface(res, listeners, circulars, name);
        } else if (isSameEventInterface(res, withState, name)) {
          res = omitEventInterface(res, name);
        }

        onEnd.forEach((tuple) => tuple[0](res));
        return res;
      });
    }) as typeof withState[typeof key];

    if (listener) withState[name].map.set(listener[0], []);

    Object.defineProperty(withState[key], "name", { value: key });
  });

  const withMethods = Object.assign(withState, {
    addEventListener: (type: string, listener: (...args: any) => any, onStart = false) => {
      const callbacks = withState[name].map.get(type);
      if (!callbacks) return;
      withState[name].map.set(type, [...callbacks, [listener, onStart]]);
    },
    removeEventListener: (type: string, listener: (...args: any) => any) => {
      const callbacks = withState[name].map.get(type);
      if (!callbacks) return;
      withState[name].map.set(
        type,
        callbacks.filter((l) => l[0] !== listener),
      );
    },
  });

  return withMethods as unknown as EventInterfaceInstance<T, L, C, N>;
}
