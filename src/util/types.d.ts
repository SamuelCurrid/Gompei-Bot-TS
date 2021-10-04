type ClearPromises<T extends any[]> =
    T extends [infer P, ...infer Rest]
    ? P extends Promise<infer X>
        ? [X, ...ClearPromises<Rest>]
        : [P, ...ClearPromises<Rest>]
    : [];
