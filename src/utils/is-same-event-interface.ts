import { isEventInterface } from "./is-event-interface";

import { AnyObject } from "../types";

export const isSameEventInterface = <N extends string = "listeners">(
  a: AnyObject,
  b: AnyObject,
  namespace = "listeners" as N,
): boolean => {
  return (
    isEventInterface(a, namespace) &&
    isEventInterface(b, namespace) &&
    a[namespace].id === b[namespace].id
  );
};
