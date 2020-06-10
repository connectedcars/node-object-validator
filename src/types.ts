import {
  OptionalDateTimeOrDate,
  OptionalFloatOrFloatString,
  OptionalFloatString,
  OptionalIntegerOrIntegerString,
  OptionalIntegerString,
  RequiredDateTimeOrDate,
  RequiredFloatOrFloatString,
  RequiredFloatString,
  RequiredIntegerOrIntegerString,
  RequiredIntegerString
} from '.'
import { OptionalArray, RequiredArray } from './validators/array'
import { OptionalDate, RequiredDate } from './validators/date'
import { OptionalDateTime, RequiredDateTime } from './validators/datetime'
import { OptionalExactString, RequiredExactString } from './validators/exact-string'
import { OptionalFloat, RequiredFloat } from './validators/float'
import { OptionalInteger, RequiredInteger } from './validators/integer'
import { OptionalObject, RequiredObject } from './validators/object'
import { OptionalRegexMatch, RequiredRegexMatch } from './validators/regex-match'
import { OptionalString, RequiredString } from './validators/string'

// https://github.com/Microsoft/TypeScript/issues/26705
export type IsUndefined<T, K> = undefined extends T ? K : never
export type IsNotUndefined<T, K> = undefined extends T ? never : K
export type UndefinedKeys<T> = { [K in keyof T]-?: IsUndefined<T[K], K> }[keyof T]
export type NotUndefinedKeys<T> = { [K in keyof T]-?: IsNotUndefined<T[K], K> }[keyof T]
export type IncludeNullableTypes<T extends object> = { [K in UndefinedKeys<T>]: T[K] }
export type ExcludeNullableTypes<T extends object> = { [K in NotUndefinedKeys<T>]: T[K] }
export type UndefinedToOptional<T extends object> = ExcludeNullableTypes<T> & Partial<IncludeNullableTypes<T>>

// https://stackoverflow.com/questions/51651499/typescript-what-is-a-naked-type-parameter
// https://2ality.com/2019/07/testing-static-types.html
// Wrapping the types in an tuple force a specific type instead of allow any in the union
export type AssertEqual<T, Expected> = [T, Expected] extends [Expected, T] ? true : never

// TODO: Add support for tuples at some point [RequiredDate, RequiredInteger, ..]
// TODO: Use tuples for defining length of typed arrays [number, number]

export type ValidatorTypes =
  | RequiredArray
  | OptionalArray
  | RequiredDate
  | OptionalDate
  | RequiredDateTime
  | OptionalDateTime
  | RequiredDateTimeOrDate
  | OptionalDateTimeOrDate
  | RequiredExactString
  | OptionalExactString
  | RequiredFloat
  | OptionalFloat
  | RequiredInteger
  | OptionalInteger
  | RequiredFloatString
  | OptionalFloatString
  | RequiredFloatOrFloatString
  | OptionalFloatOrFloatString
  | RequiredIntegerString
  | OptionalIntegerOrIntegerString
  | RequiredIntegerOrIntegerString
  | OptionalIntegerString
  | RequiredString
  | OptionalString
  | RequiredRegexMatch
  | OptionalRegexMatch
  | RequiredObject
  | OptionalObject

// prettier-ignore
type ValidatorToType<O> =
    O extends RequiredArray<infer U> ? Array<ValidatorToType<U>>
  : O extends OptionalArray<infer U> ? Array<ValidatorToType<U>> | undefined
  : O extends RequiredDate ? Date
  : O extends OptionalDate ? Date | undefined
  : O extends RequiredDateTime ? string
  : O extends OptionalDateTime ? string | undefined
  : O extends RequiredExactString ? string
  : O extends OptionalExactString ? string | undefined
  : O extends RequiredFloat ? number
  : O extends OptionalFloat ? number | undefined
  : O extends RequiredInteger ? number
  : O extends OptionalInteger ? number | undefined
  : O extends RequiredObject<infer U> ? SchemaToType<U>
  : O extends OptionalObject<infer U> ? SchemaToType<U> | undefined
  : O extends RequiredString ? string
  : O extends OptionalString ? string | undefined
  : O extends RequiredRegexMatch ? string
  : O extends OptionalRegexMatch ? string | undefined
  : never

type ObjectType<T> = {
  [P in keyof T]: ValidatorToType<T[P]>
}

export type SchemaToType<T> = UndefinedToOptional<ObjectType<T>>

export type ObjectSchema = {
  [key: string]: ValidatorTypes
}
