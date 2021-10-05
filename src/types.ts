class Base {}

export type Constructor<I = Base> = new (...args: any[]) => I;

export type InferPrototype<T> = T extends Constructor<infer P> ? P : never;

export type KeyOfRestraint<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];

export type KeyOfFunctions<T> = KeyOfRestraint<T, (...args: any) => any>;

export type ListenerTuple = [(...args: any[]) => any, boolean];

export type ListenerMap = Map<string, ListenerTuple[]>;

export type ListenerBinding<T> = { [key: string]: KeyOfFunctions<T> };

export type StringKeys<T> = Exclude<keyof T, number | symbol>;

export type StaticKeys<C extends Constructor> = Exclude<keyof C, "prototype"> extends string
  ? Exclude<keyof C, "prototype">
  : never;

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

export type BuilderKeys<C extends Constructor> = C extends Constructor<infer P>
  ? {
      [K in StaticKeys<C>]: C[K] extends (...args: any) => Promise<P> | P ? K : never;
    }[StaticKeys<C>]
  : never;

export type ExtendBuilderReturnTypes<C extends Constructor, B extends BuilderKeys<C>, E> = {
  [K in B]: C[K] extends (...args: infer A) => Promise<infer R>
    ? (...args: A) => Promise<R & E>
    : C[K] extends (...args: infer A) => infer R
    ? (...args: A) => R & E
    : never;
};

export type EventInterface<T, L extends ListenerBinding<T>, N extends string = "listeners"> = {
  [K in N]: ListenerMap;
} & EventListeners<T, L>;

export type AugmentBuilderKeys<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  B extends BuilderKeys<C>,
  N extends string = "listeners",
> = ExtendBuilderReturnTypes<C, B, EventInterface<InferPrototype<C>, L, N>> & C;

export type EventInterfaceConstructor<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  N extends string = "listeners",
> = Constructor<EventInterface<InferPrototype<C>, L, N>> & C;

export type EventInterfaceBuilderConstructor<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  B extends BuilderKeys<C>,
  N extends string = "listeners",
> = Constructor<EventInterface<InferPrototype<C>, L, N>> & AugmentBuilderKeys<C, L, B, N>;
