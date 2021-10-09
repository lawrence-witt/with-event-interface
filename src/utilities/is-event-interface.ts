import { ListenerBinding, KeyOfCirculars, EventInterfaceInstance } from "../types";

export function isEventInterface<
  T extends { [key: string]: any },
  L extends ListenerBinding<T>,
  C extends KeyOfCirculars<T> | undefined,
  N extends string = "listeners",
>(
  instance: T,
  listeners: L,
  builders?: Exclude<C, undefined>[],
  namespace = "listeners" as N,
): instance is EventInterfaceInstance<T, L, C, N> {
  return (
    namespace in instance && "addEventListener" in instance && "removeEventListener" in instance
  );
}
