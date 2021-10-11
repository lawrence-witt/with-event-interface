import { createMockInstance } from "../factories/create-mock-instance";

import { attachEventInterface } from "../functions/attach-event-interface";

test("it attaches listener state with a default namespace", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });

  const expected = new Map();
  expected.set("test", []);

  expect(instance).toHaveProperty("listeners");
  expect(instance.listeners).toEqual(expected);
});

test("it attaches listener state with a custom namespace", () => {
  const instance = attachEventInterface(
    createMockInstance(),
    { test: "syncMethod" },
    "myNamespace",
  );

  const expected = new Map();
  expected.set("test", []);

  expect(instance).toHaveProperty("myNamespace");
  expect(instance.myNamespace).toEqual(expected);
});

test("it attaches addEventListener and removeEventListener methods", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });

  expect(instance).toHaveProperty("addEventListener");
  expect(instance).toHaveProperty("removeEventListener");
  expect(typeof instance.addEventListener).toBe("function");
  expect(typeof instance.removeEventListener).toBe("function");
});

test("it attaches the event interface to new instances returned by this instance's methods", () => {
  const Foo = function (this: any) {
    this.foo = "bar";
    this.syncMethod = function () {
      return 42;
    };
    this.circularMethod = function () {
      return new (Foo as any)();
    };
  };

  const instance = attachEventInterface(new (Foo as any)(), { test: "syncMethod" });
  const actual = instance.circularMethod();

  expect(actual).toEqual(
    expect.objectContaining({
      foo: expect.stringMatching("bar"),
      listeners: expect.any(Map),
      addEventListener: expect.any(Function),
      removeEventListener: expect.any(Function),
    }),
  );
});

test("it calls an event listener attached to a synchronous method", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.syncMethod(1);

  expect(callback).toHaveBeenCalled();
});

test("it calls an event listener attached to an asynchronous method", (done) => {
  const instance = attachEventInterface(createMockInstance(), { test: "asyncMethod" });
  const callback = jest.fn(() => {
    done();
  });

  instance.addEventListener("test", callback);
  instance.asyncMethod(1);
});

test("it passes the return value of the method to the listener by default", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.syncMethod(1);

  expect(callback.mock.calls).toEqual([[1]]);
});

test("it passes no argument to the listener when onStart is true", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });
  const callback = jest.fn();

  instance.addEventListener("test", callback, true);
  instance.syncMethod(1);

  expect(callback.mock.calls).toEqual([[]]);
});

test("it does not call an event listener which has been removed", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.syncMethod(1);

  instance.removeEventListener("test", callback);
  instance.syncMethod(1);

  expect(callback).toHaveBeenCalledTimes(1);
});

test("it throws an error if the listener namespace is already assigned", () => {
  const occupied = Object.assign(createMockInstance(), { listeners: "test" });

  expect(() => {
    attachEventInterface(occupied as any, { test: "syncMethod" }, "listeners");
  }).toThrow("The property listeners already exists on the provided object.");
});

test("it throws an error if the add/removeEventListener properties are already assigned", () => {
  const add = Object.assign(createMockInstance(), { addEventListener: "test" });
  const remove = Object.assign(createMockInstance(), { removeEventListener: "test" });

  expect(() => {
    attachEventInterface(add as any, { test: "syncMethod" });
  }).toThrow("The property addEventListener already exists on the provided object.");

  expect(() => {
    attachEventInterface(remove as any, { test: "syncMethod" });
  }).toThrow("The property removeEventListener already exists on the provided object.");
});
