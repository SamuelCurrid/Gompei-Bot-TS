export type ClearPromises<T extends any[]> =
    T extends [infer P, ...infer Rest]
    ? P extends Promise<infer X>
        ? [X, ...ClearPromises<Rest>]
        : [P, ...ClearPromises<Rest>]
    : [];

export type Split<T extends string, Splitter extends string> =
    T extends `${infer A}${Splitter}${infer B}`
    ? A | Split<B, Splitter>
    : T;
