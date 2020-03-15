import { OptionalExactString, RequiredExactString } from './validators/exact-string'
import { OptionalFloat, RequiredFloat } from './validators/float'
import { OptionalInteger, RequiredInteger } from './validators/integer'
import { OptionalObject, RequiredObject } from './validators/object'
import { OptionalString, RequiredString } from './validators/string'

// https://github.com/Microsoft/TypeScript/issues/26705
export type IsNullable<T, K> = undefined extends T ? K : never
type IsNotNullable<T, K> = undefined extends T ? never : K
type NullableKeys<T> = { [K in keyof T]-?: IsNullable<T[K], K> }[keyof T]
type NotNullableKeys<T> = { [K in keyof T]-?: IsNotNullable<T[K], K> }[keyof T]
type IncludeNullableTypes<T extends object> = { [K in NullableKeys<T>]: T[K] }
type ExcludeNullableTypes<T extends object> = { [K in NotNullableKeys<T>]: T[K] }
type UndefinedToOptional<T extends object> = ExcludeNullableTypes<T> & Partial<IncludeNullableTypes<T>>

type PropertyType<O> = O extends RequiredInteger
  ? number
  : O extends OptionalInteger
  ? number | undefined
  : O extends RequiredExactString
  ? string
  : O extends OptionalExactString
  ? string | undefined
  : O extends RequiredString
  ? string
  : O extends OptionalString
  ? string | undefined
  : O extends RequiredFloat
  ? number
  : O extends OptionalFloat
  ? number | undefined
  : O extends RequiredObject<infer U>
  ? SchemaToType<U>
  : O extends OptionalObject<infer U>
  ? SchemaToType<U> | undefined
  : never

type ObjectType<T> = {
  [P in keyof T]: PropertyType<T[P]>
}

export type SchemaToType<T> = UndefinedToOptional<ObjectType<T>>
