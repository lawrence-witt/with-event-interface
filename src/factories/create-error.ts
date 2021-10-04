export const createMissingError = (key: string, struct: string): string =>
  `The property ${key} does not exist on the provided ${struct}.`;

export const createTypeError = (key: string, recieved: string): string =>
  `Expected the property ${key} to be a function. Recieved: ${recieved}.`;
