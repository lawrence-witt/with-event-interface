import { AnyObject, EventInterfaceInstance } from "../types";

export function isEventInterface<T extends AnyObject, N extends string>(
  instance: T,
  namespace: N,
): instance is EventInterfaceInstance<T, any, any, N> {
  return (
    typeof instance === "object" &&
    namespace in instance &&
    typeof instance[namespace] === "object" &&
    "id" in instance[namespace] &&
    "map" in instance[namespace] &&
    "addEventListener" in instance &&
    "removeEventListener" in instance
  );
}
