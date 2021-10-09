import { ListenerBinding, KeyOfBuilders, EventInterfaceInstance } from "../types";

export function isEventInterface<
  T extends { [key: string]: any },
  L extends ListenerBinding<T>,
  B extends KeyOfBuilders<T> | undefined,
  N extends string = "listeners",
>(
  instance: T,
  listeners: L,
  builders?: Exclude<B, undefined>[],
  namespace = "listeners" as N,
): instance is EventInterfaceInstance<T, L, B, N> {
  return (
    namespace in instance && "addEventListener" in instance && "removeEventListener" in instance
  );
}
