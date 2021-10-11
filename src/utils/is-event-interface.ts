import { AnyObject, EventInterfaceInstance } from "../types";

export function isEventInterface<T extends AnyObject>(
  instance: T,
): instance is EventInterfaceInstance<T, any, any> {
  return (
    typeof instance === "object" &&
    "addEventListener" in instance &&
    "removeEventListener" in instance
  );
}
