import { createPropertyError } from "../factories/create-error";

import { isEventInterface } from "../utils/is-event-interface";
import { isInstanceOfCustomConstructor } from "../utils/is-instance-of-custom-constructor";
import { chainIfPromise } from "../utils/chain-if-promise";
import { userFunctions } from "../utils/user-functions";

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

  const listenerEntries = Object.entries(listeners);

  userFunctions(withState).forEach((key: keyof typeof withState) => {
    if (typeof withState[key] !== "function") return;

    const original = withState[key].bind(withState);

    const listener = listenerEntries.find((entry) => entry[1] === key);

    withState[key] = ((...args: any) => {
      const resolveResult = (res: unknown) => {
        if (isInstanceOfCustomConstructor(instance, res)) {
          return attachEventInterface(res as typeof instance, listeners, namespace);
        }
        return res;
      };

      if (!withState[name]) return original(...args);

      if (!listener) {
        return chainIfPromise(original(...args), resolveResult);
      }

      const callbacks = withState[name].get(listener[0]);

      if (!callbacks) return original(...args);

      const [onEnd, onStart] = callbacks.reduce(
        (out: [ListenerTuple[], ListenerTuple[]], tuple) => {
          out[+tuple[1]].push(tuple);
          return out;
        },
        [[], []],
      );

      onStart.forEach((tuple) => tuple[0]());

      return ((res: unknown) => {
        onEnd.forEach((tuple) => tuple[0](res));
        return res;
      })(chainIfPromise(original(...args), resolveResult));
    }) as typeof withState[typeof key];

    if (listener) withState[name].set(listener[0], []);

    Object.defineProperty(withState[key], "name", { value: key });
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
