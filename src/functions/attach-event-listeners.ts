import { createPropertyError, createTypeError } from "../factories/create-error";

import { ListenerTuple, ListenerMap, ListenerBinding, EventInterfaceInstance } from "../types";

function attachEventListeners<T, L extends ListenerBinding<T>, N extends undefined>(
  instance: T,
  listeners: L,
  namespace?: N,
): EventInterfaceInstance<T, L>;

function attachEventListeners<T, L extends ListenerBinding<T>, N extends string>(
  instance: T,
  listeners: L,
  namespace: N,
): EventInterfaceInstance<T, L, N>;

function attachEventListeners<T extends { [key: string]: any }, L extends ListenerBinding<T>>(
  instance: T,
  listeners: L,
  namespace = "listeners",
): unknown {
  const name = namespace as "listeners";

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
        (out: [ListenerTuple[], ListenerTuple[]], current) => {
          out[+current[1]].push(current);
          return out;
        },
        [[], []],
      );

      onStart.forEach((tuple) => tuple[0]());

      const result = original(...args);

      if (typeof result?.then === "function") {
        return result.then((res: any) => {
          onEnd.forEach((tuple) => tuple[0](res));
          return res;
        });
      } else {
        onEnd.forEach((tuple) => tuple[0](result));
        return result;
      }
    }) as typeof withState[typeof method];

    withState[name].set(type, []);
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

export default attachEventListeners;
