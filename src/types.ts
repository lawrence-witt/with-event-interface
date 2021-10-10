class Base {}

export type AnyObject = { [key: PropertyKey]: any };

export type Constructor<I = Base> = new (...args: any[]) => I;

export type InferPrototype<T> = T extends Constructor<infer P> ? P : never;

export type KeyOfConstraint<T, U> = {
  [P in keyof T]: T[P] extends U ? P : never;
}[keyof T] extends keyof T
  ? { [P in keyof T]: T[P] extends U ? P : never }[keyof T]
  : never;

export type KeyOfFunctions<T> = KeyOfConstraint<T, (...args: any) => any>;

export type StringKeys<T> = Exclude<keyof T, number | symbol>;

export type DistributeProperties<T extends string> = T extends any ? { [K in T]: any } : never;

export type ReservedProperties<N extends string> = DistributeProperties<
  N | keyof EventListeners<any, any>
>;

export type ListenerTuple = [(...args: any[]) => any, boolean];

export type ListenerBinding<T> = {
  [key: string]: KeyOfConstraint<T, (...args: any) => any>;
};

export type ListenerState = {
  id: string;
  map: Map<string, ListenerTuple[]>;
};

// Event Types

export interface EventListeners<T, L extends ListenerBinding<T>> {
  addEventListener<Type extends StringKeys<L>>(
    type: Type,
    listener: () => any,
    onStart: true,
  ): void;
  addEventListener<Type extends StringKeys<L>>(
    type: Type,
    listener: (args: ReturnType<T[L[Type]]>) => any,
    onStart?: false,
  ): void;
  removeEventListener<Type extends StringKeys<L>>(
    type: Type,
    listener: (args: ReturnType<T[L[Type]]>) => any,
  ): void;
}

export type EventInterface<T, L extends ListenerBinding<T>, N extends string = "listeners"> = {
  [K in N]: ListenerState;
} & EventListeners<T, L>;

// Builder Types

export type KeyOfCirculars<T> = KeyOfConstraint<T, (...args: any) => Promise<T> | T>;

export type KeyOfBuilders<C extends Constructor> = KeyOfConstraint<
  C,
  (...args: any) => Promise<InferPrototype<C>> | InferPrototype<C>
>;

export type ExtendCircularReturnTypes<T, P extends KeyOfFunctions<T>, E> = {
  [K in P]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => ExtendCircularReturnTypes<T, P, E> & E & R
    : T[K] extends (...args: infer A) => Promise<infer R>
    ? (...args: A) => Promise<ExtendCircularReturnTypes<T, P, E> & E & R>
    : never;
};

export type ExtendReturnTypes<T, P extends KeyOfFunctions<T>, E> = {
  [K in P]: T[K] extends (...args: infer A) => Promise<infer R>
    ? (...args: A) => Promise<E & R>
    : T[K] extends (...args: infer A) => infer R
    ? (...args: A) => E & R
    : never;
};

export type AugmentedConstructor<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  Ci extends KeyOfCirculars<InferPrototype<C>> | undefined,
  B extends KeyOfBuilders<C> | undefined,
  N extends string = "listeners",
> = [B] extends [KeyOfBuilders<C>]
  ? ExtendReturnTypes<C, B, EventInterfaceInstance<InferPrototype<C>, L, Ci, N>> & C
  : C;

// Return Types

export type EventInterfaceInstance<
  T,
  L extends ListenerBinding<T>,
  C extends KeyOfCirculars<T> | undefined,
  N extends string = "listeners",
> = [C] extends [KeyOfCirculars<T>]
  ? EventInterface<T, L, N> &
      ExtendCircularReturnTypes<T, C, EventInterface<T, L, N>> &
      ExtendCircularReturnTypes<T, KeyOfCirculars<T>, Record<string, never>> &
      T
  : EventInterface<T, L, N> &
      ExtendCircularReturnTypes<T, KeyOfCirculars<T>, Record<string, never>> &
      T;

export type EventInterfaceConstructor<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  Ci extends KeyOfCirculars<InferPrototype<C>> | undefined,
  B extends KeyOfBuilders<C> | undefined,
  N extends string = "listeners",
> = [B] extends [KeyOfBuilders<C>]
  ? Constructor<EventInterfaceInstance<InferPrototype<C>, L, Ci, N>> &
      AugmentedConstructor<C, L, Ci, B, N>
  : Constructor<EventInterfaceInstance<InferPrototype<C>, L, Ci, N>> & C;
