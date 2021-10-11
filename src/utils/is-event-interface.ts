import { AnyObject, EventInterfaceInstance } from "../types";

export function isEventInterface<T extends AnyObject>(
  instance: T,
  namespace?: string,
): instance is EventInterfaceInstance<T, any, any> {
  return (
    typeof instance === "object" &&
    "addEventListener" in instance &&
    "removeEventListener" in instance &&
    (typeof namespace === "string" ? namespace in instance : true)
  );
}
