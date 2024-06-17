import {
  ValidateOptions,
  ValidatorBase,
  ValidatorBaseOptions,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { NotObjectFail, ValidationFailure } from '../errors'

export function isRecord<T extends ValidatorBase>(
  schema: T,
  value: unknown,
  context?: string
): value is Record<string, T['tsType']> {
  const errors = validateRecord(schema, value, context, { earlyFail: true })
  if (errors.length === 0) {
    return true
  }
  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPlainRecord(value: unknown): value is Record<string | number | symbol, any> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

export function validateRecord(
  schema: ValidatorBase,
  value: unknown,
  context?: string,
  options?: ValidateOptions
): ValidationFailure[] {
  const errors: ValidationFailure[] = []
  if (!isPlainRecord(value)) {
    errors.push(new NotObjectFail(`Must be an object`, value, context))
    return errors
  }
  for (const key of Object.keys(value)) {
    const keyName = context ? `${context}['${key}']` : key
    errors.push(...schema.validate(value[key], keyName, { optimized: false, earlyFail: false, ...options }))
    if (options?.earlyFail && errors.length > 0) {
      return errors
    }
  }
  return errors
}

export abstract class RecordValidator<T extends ValidatorBase = never, O = never> extends ValidatorBase<
  Record<string, T['tsType']> | O
> {
  public schema: T

  public constructor(schema: T, options?: ValidatorBaseOptions) {
    super(options)
    this.schema = schema
    if (options?.optimize !== false) {
      this.optimize(schema)
    }
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types === true) {
      return this.typeString(options)
    } else {
      return this.constructorString(options)
    }
  }

  protected validateValue(value: unknown, context?: string, options?: ValidateOptions): ValidationFailure[] {
    return validateRecord(this.schema, value, context, { earlyFail: this.earlyFail, ...options })
  }

  private typeString(options?: ValidatorExportOptions): string {
    const language = options?.language ?? 'typescript'
    switch (language) {
      case 'typescript': {
        let typeStr = `Record<string, ${this.schema.toString(options)}>`

        if (this.required === false) {
          typeStr += ` | undefined`
        }
        if (this.nullable === true) {
          typeStr += ` | null`
        }

        return typeStr
      }
      case 'rust': {
        const isOption = !this.required || this.nullable
        const typeStr = `HashMap<String, ${this.schema.toString(options)}>`
        return isOption ? `Option<${typeStr}>` : typeStr
      }
      default: {
        throw new Error(`Language: '${options?.language}' unknown`)
      }
    }
  }

  private constructorString(options?: ValidatorExportOptions): string {
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${this.schema.toString(options)}${optionsStr})`
  }
}

export class RequiredRecord<T extends ValidatorBase> extends RecordValidator<T> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options })
  }
}

export class OptionalRecord<T extends ValidatorBase> extends RecordValidator<T, undefined> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}

export class NullableRecord<T extends ValidatorBase> extends RecordValidator<T, null> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, nullable: true })
  }
}

export class OptionalNullableRecord<T extends ValidatorBase> extends RecordValidator<T, undefined | null> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, required: false, nullable: true })
  }
}
