import { RunnableFunctionWithoutParse } from "openai/lib/RunnableFunction.mjs"

export type FnSpecBase<T extends any = any> = Omit<
  RunnableFunctionWithoutParse,
  "function" | "parameters"
> & {
  parameters: TypeToJSONSchema<T>
}

export type FnSpecBaseWithoutParams = Omit<
  RunnableFunctionWithoutParse,
  "function"
>

export const buildBaseSpec =
  <T extends any>() =>
  <SpecType extends FnSpecBase<T>>(spec: SpecType) => {
    return spec as Omit<typeof spec, "parameters"> & {
      parameters: RunnableFunctionWithoutParse["parameters"]
    }
  }

type JSONSchemaToTS<T> = T extends { type: "object"; properties: infer P }
  ? { [K in keyof P]: JSONSchemaToTS<P[K]> }
  : T extends { type: "array"; items: infer I }
    ? JSONSchemaToTS<I>[]
    : T extends { type: "string" }
      ? string
      : T extends { type: "number" }
        ? number
        : T extends { type: "integer" }
          ? number
          : T extends { type: "boolean" }
            ? boolean
            : T extends { type: "null" }
              ? null
              : never

export type TypeToJSONSchema<T> = T extends string
  ? { type: "string" }
  : T extends number
    ? { type: "number" }
    : T extends boolean
      ? { type: "boolean" }
      : T extends Array<infer U>
        ? { type: "array"; items: TypeToJSONSchema<U> }
        : T extends object
          ? {
              type: "object"
              properties: { [K in keyof T]: TypeToJSONSchema<T[K]> }
            }
          : never
