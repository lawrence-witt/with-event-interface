export const createPropertyError = (key: string, struct: string, expected: boolean): string =>
  `The property ${key} ${
    expected ? "does not exist" : "already exists"
  } on the provided ${struct}.`;

export const createTypeError = (key: string, expected: string, recieved: string): string =>
  `Expected the property ${key} to be of type: ${expected}. Recieved: ${recieved}.`;
