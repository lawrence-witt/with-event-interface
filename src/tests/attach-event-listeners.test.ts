import { createMockInstance } from "../factories/create-mock-instance";

import attachEventListeners from "../functions/attach-event-listeners";

test("it attaches listener state with a default namespace", () => {
  const instance = attachEventListeners(createMockInstance(), { test: "syncMethodProperty" });

  const expected = new Map();
  expected.set("test", []);

  expect(instance).toHaveProperty("listeners");
  expect(instance.listeners).toEqual(expected);
});

test("it attaches listener state with a custom namespace", () => {
  const instance = attachEventListeners(
    createMockInstance(),
    { test: "syncMethodProperty" },
    "myNamespace",
  );

  const expected = new Map();
  expected.set("test", []);

  expect(instance).toHaveProperty("myNamespace");
  expect(instance.myNamespace).toEqual(expected);
});

test("it attaches addEventListener and removeEventListener methods", () => {
  const instance = attachEventListeners(createMockInstance(), { test: "syncMethodProperty" });

  expect(instance).toHaveProperty("addEventListener");
  expect(instance).toHaveProperty("removeEventListener");
  expect(typeof instance.addEventListener).toBe("function");
  expect(typeof instance.removeEventListener).toBe("function");
});

test("it calls an event listener attached to a synchronous method", () => {
  const instance = attachEventListeners(createMockInstance(), { test: "syncMethodProperty" });
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.syncMethodProperty(1);

  expect(callback).toHaveBeenCalled();
});

test("it calls an event listener attached to an asynchronous method", (done) => {
  const instance = attachEventListeners(createMockInstance(), { test: "asyncMethodProperty" });
  const callback = jest.fn(() => {
    done();
  });

  instance.addEventListener("test", callback);
  instance.asyncMethodProperty(1);
});

test("it passes the return value of the method to the listener by default", () => {
  const instance = attachEventListeners(createMockInstance(), { test: "syncMethodProperty" });
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.syncMethodProperty(1);

  expect(callback.mock.calls).toEqual([[1]]);
});

test("it passes no argument to the listener when onStart is specified", () => {
  const instance = attachEventListeners(createMockInstance(), { test: "syncMethodProperty" });
  const callback = jest.fn();

  instance.addEventListener("test", callback, true);
  instance.syncMethodProperty(1);

  expect(callback.mock.calls).toEqual([[]]);
});

test("it does not call an event listener which has been removed", () => {
  const instance = attachEventListeners(createMockInstance(), { test: "syncMethodProperty" });
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.syncMethodProperty(1);

  instance.removeEventListener("test", callback);
  instance.syncMethodProperty(1);

  expect(callback).toHaveBeenCalledTimes(1);
});

test("it throws an error if the listener property is already assigned", () => {
  const occupied = Object.assign(createMockInstance(), { listeners: "test" });

  expect(() => {
    attachEventListeners(occupied, { test: "syncMethodProperty" });
  }).toThrow("The property listeners already exists on the provided object.");
});

test("it throws an error if the add/removeEventListener properties are already assigned", () => {
  const add = Object.assign(createMockInstance(), { addEventListener: "test" });
  const remove = Object.assign(createMockInstance(), { removeEventListener: "test" });

  expect(() => {
    attachEventListeners(add, { test: "syncMethodProperty" });
  }).toThrow("The property addEventListener already exists on the provided object.");

  expect(() => {
    attachEventListeners(remove, { test: "syncMethodProperty" });
  }).toThrow("The property removeEventListener already exists on the provided object.");
});

test("it throws an error if the targeted property does not exist", () => {
  expect(() => {
    attachEventListeners(createMockInstance(), { test: "missingProperty" } as any);
  }).toThrow("The property missingProperty does not exist on the provided object.");
});

test("it throws an error if the targeted property is not a method", () => {
  expect(() => {
    attachEventListeners(createMockInstance(), { test: "stringProperty" as any });
  }).toThrow("Expected the property stringProperty to be of type: function. Recieved: string.");
});
