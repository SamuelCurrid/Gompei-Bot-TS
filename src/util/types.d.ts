export type Thisify<
    UseThis extends boolean,
    T extends (...args: any[]) => any
> = Parameters<T> extends [infer State, ...infer TArgs]
    ? UseThis extends true
        ? (this: State, ...any: TArgs) => ReturnType<T>
        : T
    : T;