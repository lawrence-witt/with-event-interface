export const createPropertyError = (key: PropertyKey, struct: string, expected: boolean): string =>
  `The property ${String(key)} ${
    expected ? "does not exist" : "already exists"
  } on the provided ${struct}.`;

export const createTypeError = (key: PropertyKey, expected: string, recieved: string): string =>
  `Expected the property ${String(key)} to be of type: ${expected}. Recieved: ${recieved}.`;
