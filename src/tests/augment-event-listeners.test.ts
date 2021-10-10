import { createMockConstructor } from "../factories/create-mock-constructor";

import { augmentEventInterface } from "../functions/augment-event-interface";

test("it attaches the event interface to an instance of an augmented class", () => {
  const constructor = augmentEventInterface(createMockConstructor(), {
    test: "syncMethodProperty",
  });
  const instance = new constructor();

  expect(instance).toHaveProperty("listeners");

  const expected = {
    id: instance.listeners.id,
    map: new Map(),
  };
  expected.map.set("test", []);

  expect(instance.listeners).toEqual(expected);
  expect(instance).toHaveProperty("addEventListener");
  expect(instance).toHaveProperty("removeEventListener");
  expect(typeof instance.addEventListener).toBe("function");
  expect(typeof instance.removeEventListener).toBe("function");
});

test("it correctly calls an event listener attached to a class method", () => {
  const constructor = augmentEventInterface(createMockConstructor(), {
    test: "syncMethodProperty",
  });
  const instance = new constructor();
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.syncMethodProperty(1);

  expect(callback.mock.calls).toEqual([[[1, "scopedString"]]]);
});

test("it returns an instance of the augmented class from specified static keys synchronously", () => {
  const constructor = augmentEventInterface(
    createMockConstructor(),
    {
      test: "syncMethodProperty",
    },
    undefined,
    ["syncBuild"],
  );
  const instance = constructor.syncBuild();

  expect(instance).toHaveProperty("listeners");
  expect(instance).toHaveProperty("addEventListener");
  expect(instance).toHaveProperty("removeEventListener");
});

test("it returns an instance of the augmented class from specified static keys asynchronously", (done) => {
  const constructor = augmentEventInterface(
    createMockConstructor(),
    {
      test: "syncMethodProperty",
    },
    undefined,
    ["asyncBuild"],
  );

  constructor.asyncBuild().then((instance) => {
    expect(instance).toHaveProperty("listeners");
    expect(instance).toHaveProperty("addEventListener");
    expect(instance).toHaveProperty("removeEventListener");
    done();
  });
});

test("it throws an error if the targeted static property does not exist", () => {
  expect(() => {
    augmentEventInterface(createMockConstructor(), { test: "syncMethodProperty" }, undefined, [
      "missingProperty" as any,
    ]);
  }).toThrow("The property missingProperty does not exist on the provided constructor.");
});

test("it throws an error if the targeted static property is not a method", () => {
  expect(() => {
    augmentEventInterface(createMockConstructor(), { test: "syncMethodProperty" }, undefined, [
      "staticProperty" as any,
    ]);
  }).toThrow("Expected the property staticProperty to be of type: function. Recieved: string.");
});
