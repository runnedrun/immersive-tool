export type NullablePropertiesOptional<T> = {
  [K in keyof T]: T[K] extends null
    ? T[K] | undefined
    : undefined extends T[K]
    ? T[K] | undefined
    : T[K];
};
