import { createMockConstructor } from "../factories/create-mock-constructor";

import augmentEventListeners from "../functions/augment-event-listeners";

test("it attaches the event interface to an instance of an augmented class", () => {
  const constructor = augmentEventListeners(createMockConstructor(), {
    test: "syncMethodProperty",
  });
  const instance = new constructor();

  const expected = new Map();
  expected.set("test", []);

  expect(instance).toHaveProperty("listeners");
  expect(instance.listeners).toEqual(expected);
  expect(instance).toHaveProperty("addEventListener");
  expect(instance).toHaveProperty("removeEventListener");
  expect(typeof instance.addEventListener).toBe("function");
  expect(typeof instance.removeEventListener).toBe("function");
});

test("it correctly calls an event listener attached to a class method", () => {
  const constructor = augmentEventListeners(createMockConstructor(), {
    test: "syncMethodProperty",
  });
  const instance = new constructor();
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.syncMethodProperty(1);

  expect(callback.mock.calls).toEqual([[[1, "scopedString"]]]);
});

test("it returns an instance of the augmented class from specified static keys synchronously", () => {
  const constructor = augmentEventListeners(
    createMockConstructor(),
    {
      test: "syncMethodProperty",
    },
    ["syncBuild"],
  );
  const instance = constructor.syncBuild();

  expect(instance).toHaveProperty("listeners");
  expect(instance).toHaveProperty("addEventListener");
  expect(instance).toHaveProperty("removeEventListener");
});

test("it returns an instance of the augmented class from specified static keys asynchronously", (done) => {
  const constructor = augmentEventListeners(
    createMockConstructor(),
    {
      test: "syncMethodProperty",
    },
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
    augmentEventListeners(createMockConstructor(), { test: "syncMethodProperty" }, [
      "missingProperty" as any,
    ]);
  }).toThrow("The property missingProperty does not exist on the provided constructor.");
});

test("it throws an error if the targeted static property is not a method", () => {
  expect(() => {
    augmentEventListeners(createMockConstructor(), { test: "syncMethodProperty" }, [
      "staticProperty" as any,
    ]);
  }).toThrow("Expected the property staticProperty to be of type: function. Recieved: string.");
});
