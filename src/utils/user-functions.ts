//https://stackoverflow.com/a/47714550/12799351

type AnyObject = { [key: PropertyKey]: any };

const isGetter = (x: AnyObject, name: string) =>
  Boolean((Object.getOwnPropertyDescriptor(x, name) || {}).get);
const isFunction = (x: AnyObject, name: string) => typeof x[name] === "function";

const deepFunctions = (x: AnyObject): string[] | false =>
  x &&
  x !== Object.prototype &&
  Object.getOwnPropertyNames(x)
    .filter((name) => isGetter(x, name) || isFunction(x, name))
    .concat(deepFunctions(Object.getPrototypeOf(x)) || []);

const distinctDeepFunctions = (x: AnyObject): string[] =>
  Array.from(new Set(deepFunctions(x) || undefined));

export const userFunctions = (x: AnyObject): string[] =>
  distinctDeepFunctions(x).filter((name) => name !== "constructor" && !~name.indexOf("__"));
