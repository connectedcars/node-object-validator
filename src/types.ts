import { ValidationErrorContext } from './errors'
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
type UndefinedKeys<T> = { [K in keyof T]-?: IsUndefined<T[K], K> }[keyof T]
type NotUndefinedKeys<T> = { [K in keyof T]-?: IsNotUndefined<T[K], K> }[keyof T]
type IncludeNullableTypes<T extends object> = { [K in UndefinedKeys<T>]: T[K] }
type ExcludeNullableTypes<T extends object> = { [K in NotUndefinedKeys<T>]: T[K] }
type UndefinedToOptional<T extends object> = ExcludeNullableTypes<T> & Partial<IncludeNullableTypes<T>>

// TODO: Add support for tuples at some point [RequiredDate, RequiredInteger, ..]

type ArrayTypes =
  | RequiredArray
  | OptionalArray
  | RequiredDate
  | OptionalDate
  | RequiredDateTime
  | OptionalDateTime
  | RequiredExactString
  | OptionalExactString
  | RequiredFloat
  | OptionalFloat
  | RequiredInteger
  | OptionalInteger
  | RequiredString
  | OptionalString
  | RequiredRegexMatch
  | OptionalRegexMatch

export type ValidatorTypes = ArrayTypes | RequiredObject | OptionalObject

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

export interface Validator {
  schema?: ObjectSchema | ArraySchema
  validate(value: unknown, context?: ValidationErrorContext): Error | null
}

export type ObjectSchema = {
  [key: string]: Validator
}

export type ArraySchema = ObjectSchema | ArrayTypes

export type Schema = ObjectSchema | ArraySchema | ValidatorTypes

export type SchemaToType<T> = UndefinedToOptional<ObjectType<T>>
