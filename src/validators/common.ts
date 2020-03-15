import { ValidationErrorContext } from '../errors'

export type Schema = {
  [key: string]: Validator
}

export interface Validator {
  schema?: Schema
  validate(value: unknown, context?: ValidationErrorContext): Error | null
}
