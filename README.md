# with-event-interface

Adds a simple, intuitive event interface to any JavaScript object or class constructor. Attach listeners to your methods and run side-effects whenever they get called. Augment static methods of your classes with event interface functionality so new instances are always ready to use.

## Getting Started

### Installation

```
npm install with-event-interface
```

### Imports

```
import { attachEventInterface, augmentEventInterface } from "with-event-interface";
```

This library exposes two core functions. To attach an event interface to a JavaScript object, use `attachEventInterface`; to augment a class constructor with event interface functionality, use `augmentEventInterface`.

## AttachEventInterface

```
function attachEventInterface(instance, listeners, namespace?) {};
```

### Parameters

`instance` - the object to attach event listeners to (this will mutate the provided object).

`listeners` - a record binding event types to method names.

`namespace` - (_optional_) - the property on the object where event state will be stored. Defaults to `"listeners"`.

### Return Value

The same instance passed in, with an attached event interface.

### Usage

<details>
<summary>Expand</summary>
<br/>

```
const myMaths = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};

attachEventInterface(myMaths, {
  added: "add",
  subracted: "subtract",
});
```

</details>
<br/>

## AugmentEventInterface

```
function augmentEventInterface(constructor, listeners, builders?, namespace?) {};
```

### Parameters

`constructor` - the class constructor to augment with event functionality (this will NOT mutate the provided constructor).

`listeners` - a record binding event types to method names.

`builders` - (_optional_) - an array of static method names which return instances of the class. Defaults to `undefined`.

`namespace` - (_optional_) - the property on the class where event state will be stored. Defaults to `"listeners"`.

### Return Value

A new class constructor with added event interface functionality.

### Usage

<details>
<summary>Expand</summary>
<br/>

```
class MyMaths {
  add(a, b) {
    return a + b;
  }

  subtract(a, b) {
    return a - b;
  }
}

const MyMathsWithEvents = augmentEventInterface(MyMaths, {
  added: "add",
  subracted: "subtract",
});

const myMaths = new MyMathsWithEvents();
```

</details>
<br/>

## The Event Interface

Once you have an object which has been extended with event functionality, you can attach listeners to it to trigger callbacks when specified methods have been called. This interface is very similar to the one already in use by various Web APIs. After extending your object, it will now expose two new methods, `addEventListener` and `removeEventListener`.

```
function addEventListener(type, callback, onStart?) {};
```

### Parameters

`type` - an event type which has been bound to a method.

`callback` - the callback to execute when its type-assigned method is called. When `onStart` is false, the callback will recieve the return value of the method as its only argument.

`onStart` - (_optional_) - whether the callback should be run before or after the method is executed. Defaults to `false`.

### Return Value

Void.

```
function removeEventListener(type, callback) {};
```

### Parameters

`type` - an event type which has been bound to a method.

`callback` - a previously assigned callback. This should have reference equality with the callback that was passed to `addEventListener`.

### Return Value

Void.

## Examples

### Synchronous Listeners

```
const myMethods = {
  slice: (a, b) => a.slice(b),
  concat: (a, b) => a.concat(b),
};

attachEventInterface(myMethods, {
  sliced: "slice",
  concatted: "concat",
});

myMethods.addEventListener("sliced", (value) => console.log(value));
myMethods.addEventListener("concatted", (value) => console.log(value), true);

myMethods.slice([1, 2, 3], 1);
  // console logs: [2, 3]

myMethods.concat([1], [2]);
  // console logs: undefined
```

Note that in the above example, `value` is `undefined` where `onStart` is `true`. This listener callback is being run before the method it is bound to.

### Asynchronous Listeners

```
const myMethods = {
  slice: async (a, b) => a.slice(b),
};

attachEventInterface(myMethods, {
  sliced: "slice",
});

myMethods.addEventListener("sliced", (value) => console.log(value));

myMethods.slice([1, 2, 3], 1);
  // console logs: [2, 3]

myMethods.slice({}, 1).catch((err) => console.log(err.message));
  // console logs: "a.slice is not a function"
```

Note that in the above example, the listener callback will not be executed if the promise it is waiting on rejects.

### Class Builders

```
class MyInterface {
  api: SomeAsyncAPI;

  constructor(api) {
    this.api = api;
  }

  static async build() {
    return new MyInterface(await SomeAsyncAPI());
  }

  start() {
    this.api.start();
  }
}

const MyInterfaceWithEvents = augmentEventInterface(
  MyInterface,
  {
    started: "start",
  },
  ["build"],
);

(async () => {
  const interface = await MyInterfaceWithEvents.build();

  interface.addEventListener("started", () => console.log("api started"));

  interface.start();
    // console logs: "api started"
})();
```

## TypeScript

`with-event-interface` has been written in and is expressly designed for use with TypeScript. All arguments to the two exposed functions are checked for type safety, and the functions themselves return expressive types which describe the enhanced objects and classes they transform.

### Satisfying the Compiler

All method keys provided in the `listeners` argument must refer to public methods on the object or constructor in question. Unfortunately it is not possible at this time to dynamically retrieve private/protected method names from a class, although this is a [proposed feature](https://github.com/microsoft/TypeScript/issues/22677) which may make its way to the language at some point.

A "builder" is defined here as a static method on a class which returns either an instance of the class, or a Promise which resolves to an instance of the class. Only methods which satisfy this signature can have their names passed to the `builders` argument.

<details>
<summary>Expand</summary>
<br/>

```
class MyClass {
  static build() {
    return new MyClass();
  }

  static methodA() {
    return;
  }

  private methodB() {
    return;
  }

  methodC() {
    return;
  }
}

augmentEventInterface(MyClass, { B: "methodB" });
  // Type '"methodB"' is not assignable to type '"methodC"'.

augmentEventInterface(MyClass, { C: "methodC" }, ["methodA"]);
  // Type '"methodA"' is not assignable to type '"build"'.
```

</details>
<br/>

### Generics

The `augmentEventInterface` function generally preserves generic type parameters in classes, with the exception of classes returned from a static builder. This is because in order to type the return of the builder accurately, we must gain access to its original return type, and in doing so any generic arguments provided to that builder are permanently widened.

<details>
<summary>Expand</summary>
<br/>

```
type Letters = "A" | "B" | "C";

class MyClass<T extends Letters> {
  letter: T;

  constructor(letter: T) {
    this.letter = letter;
  }

  static build<T extends Letters>(letter: T) {
    return new MyClass(letter);
  }

  methodA<U extends Letters>(original: T, added: U) {
    return;
  }
}

const MyClassWithEvents = augmentEventInterface(
  MyClass,
  {
    method: "methodA",
  },
  ["build"],
);

const init = new MyClassWithEvents("A");
const built = MyClassWithEvents.build("A");

init.letter;
  // "A"
init.methodA;
  // <U extends Letters>(original: "A", added: U) => void

built.letter;
  // Letters
built.methodA;
  // <U extends Letters>(original: Letters, added: U) => void
```

</details>
<br/>

This is another issue which may be solved in the future by a [proposed feature](https://github.com/microsoft/TypeScript/issues/1213), but in the meantime, the suggested workaround is to build your class first and then attach event listeners to it. This is almost functionally identical to what `augmentEventInterface` does, albeit without the neat encapsulation, which you could approximate yourself with a helper function.

<details>
<summary>Expand</summary>
<br/>

```
type Letters = "A" | "B" | "C";

class MyClass<T extends Letters> {
  letter: T;

  constructor(letter: T) {
    this.letter = letter;
  }

  static build<T extends Letters>(letter: T) {
    return new MyClass(letter);
  }

  methodA<U extends Letters>(original: T, added: U) {
    return;
  }
}

const buildClassWithEventListeners = <T extends Letters>(letter: T) => {
  return attachEventInterface(MyClass.build(letter), {
    method: "methodA",
  });
};

const built = buildClassWithEventListeners("A");

built.letter;
  // "A"
built.methodA;
  // <U extends Letters>(original: "A", added: U) => void
```

</details>
<br/>

## Contributors

[@lawrence-witt](https://github.com/lawrence-witt)

## Changelog

- ### 0.1.0 - TBC
  - Initial release.

## License

This library is provided under the MIT License - see the LICENSE file for details.
