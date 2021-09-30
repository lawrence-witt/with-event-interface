import { ListenerTuple, ListenerMap, ListenerBinding, EventInterface } from "../types";

function attachEventListeners<T, L extends ListenerBinding<T>, N extends undefined>(
  instance: T,
  listeners: L,
  namespace?: N,
): EventInterface<T, L>;

function attachEventListeners<T, L extends ListenerBinding<T>, N extends string>(
  instance: T,
  listeners: L,
  namespace: N,
): EventInterface<T, L, N>;

function attachEventListeners<T extends { [key: string]: any }, L extends ListenerBinding<T>>(
  instance: T,
  listeners: L,
  namespace = "listeners",
): EventInterface<T, L, string> {
  const name = namespace as "listeners";

  const withState = Object.assign(instance, { [name]: new Map() as ListenerMap });

  Object.entries(listeners).forEach(([type, method]) => {
    if (typeof method !== "string") throw new Error("Method name must be a string.");

    if (!(method in withState)) {
      throw new Error(`The property ${method} does not exist on the provided object.`);
    }

    if (typeof withState[method] !== "function") {
      throw new Error(
        `Expected the property ${method} to be a function. Recieved: ${typeof withState[method]}.`,
      );
    }

    const original = withState[method].bind(withState);

    withState[method] = ((...args: any) => {
      const listeners = withState[name].get(type);

      if (!listeners) return original(...args);

      const [onEnd, onStart] = listeners.reduce(
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
      const listeners = withState[name].get(type);
      if (!listeners) return;
      withState[name].set(type, [...listeners, [listener, onStart]]);
    },
    removeEventListener: (type: string, listener: (...args: any) => any) => {
      const listeners = withState[name].get(type);
      if (!listeners) return;
      withState[name].set(
        type,
        listeners.filter((l) => l[0] !== listener),
      );
    },
  });

  return withMethods;
}

export default attachEventListeners;
