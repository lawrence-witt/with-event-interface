class Base {}

export type Constructor<I = Base> = new (...args: any[]) => I;

export type InferPrototype<T> = T extends Constructor<infer P> ? P : never;

export type KeyOfConstraint<T, U> = {
  [P in keyof T]: T[P] extends U ? P : never;
}[keyof T] extends PropertyKey
  ? { [P in keyof T]: T[P] extends U ? P : never }[keyof T]
  : never;

export type KeyOfFunctions<T> = KeyOfConstraint<T, (...args: any) => any>;

export type StringKeys<T> = Exclude<keyof T, number | symbol>;

export type DistributeProperties<T extends PropertyKey> = T extends any ? { [K in T]: any } : never;

export type IncludesKey<T, U extends string> = T extends DistributeProperties<U> ? true : false;

export type TypeTernary<C, T, U> = C extends true ? T : U;

export type ListenerTuple = [(...args: any[]) => any, boolean];

export type ListenerMap = Map<string, ListenerTuple[]>;

export type ListenerBinding<T> = { [key: string]: KeyOfFunctions<T> };

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
  [K in N]: ListenerMap;
} & EventListeners<T, L>;

// Builder Types

export type KeyOfCirculars<T> = KeyOfConstraint<T, (...args: any) => Promise<T> | T>;

export type KeyOfBuilders<C extends Constructor> = KeyOfConstraint<
  C,
  (...args: any) => Promise<InferPrototype<C>> | InferPrototype<C>
>;

export type ExtendReturnTypes<T, P extends KeyOfFunctions<T>, E> = {
  [K in P]: T[K] extends (...args: infer A) => Promise<infer R>
    ? (...args: A) => Promise<E & R>
    : T[K] extends (...args: infer A) => infer R
    ? (...args: A) => E & R
    : never;
};

export type ExtendCircularReturnTypes<T, P extends KeyOfFunctions<T>, E> = {
  [K in P]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => ExtendCircularReturnTypes<T, P, E> & E & R
    : T[K] extends (...args: infer A) => Promise<infer R>
    ? (...args: A) => Promise<ExtendCircularReturnTypes<T, P, E> & E & R>
    : never;
};

export type AugmentedConstructor<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  Circ extends KeyOfCirculars<InferPrototype<C>> | undefined,
  B extends KeyOfBuilders<C> | undefined,
  N extends string = "listeners",
> = [B] extends [KeyOfBuilders<C>]
  ? ExtendReturnTypes<C, B, EventInterfaceInstance<InferPrototype<C>, L, Circ, N>> & C
  : C;

// Return Types

export type EventInterfaceInstance<
  T,
  L extends ListenerBinding<T>,
  C extends KeyOfCirculars<T> | undefined = undefined,
  N extends string = "listeners",
> = IncludesKey<T, N | keyof EventListeners<any, any>> extends true
  ? never
  : [C] extends [KeyOfCirculars<T>]
  ? EventInterface<T, L, N> & ExtendCircularReturnTypes<T, C, EventInterface<T, L, N>> & T
  : EventInterface<T, L, N> & T;

export type EventInterfaceConstructor<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  Circ extends KeyOfCirculars<InferPrototype<C>> | undefined = undefined,
  B extends KeyOfBuilders<C> | undefined = undefined,
  N extends string = "listeners",
> = IncludesKey<InferPrototype<C>, N | keyof EventListeners<any, any>> extends true
  ? never
  : [B] extends [KeyOfBuilders<C>]
  ? Constructor<EventInterfaceInstance<InferPrototype<C>, L, Circ, N>> &
      AugmentedConstructor<C, L, Circ, B, N>
  : Constructor<EventInterfaceInstance<InferPrototype<C>, L, Circ, N>> & C;
