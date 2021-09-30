import { ListenerTuple, ListenerMap, ListenerBinding, EventInterface } from "../types";

export default function attachEventListeners<T, L extends ListenerBinding<T>, N extends undefined>(
  instance: T,
  listeners: L,
  namespace?: N,
): EventInterface<T, L>;

export default function attachEventListeners<T, L extends ListenerBinding<T>, N extends string>(
  instance: T,
  listeners: L,
  namespace: N,
): EventInterface<T, L, N>;

export default function attachEventListeners<
  T extends { [key: string]: any },
  L extends ListenerBinding<T>,
>(instance: T, listeners: L, namespace = "listeners"): EventInterface<T, L, string> {
  const name = namespace as "listeners";

  const withState = Object.assign(instance, { [name]: new Map() as ListenerMap });

  Object.entries(listeners).forEach(([type, method]) => {
    if (!Object.prototype.hasOwnProperty.call(withState, method)) return;

    const original = withState[method];

    if (typeof original !== "function") return;

    withState[method] = ((...args: any) => {
      const listeners = withState[name].get(type);

      if (!listeners) return original(...args);

      const [onStart, onEnd] = listeners.reduce(
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
