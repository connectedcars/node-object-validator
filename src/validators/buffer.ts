import { ValidatorBase, ValidatorBaseOptions, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotBufferFail, ValidationFailure } from '../errors'

export function isBuffer(value: unknown, context?: string): value is Buffer {
  const errors = validateBuffer(value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateBuffer(value: unknown, context?: string): ValidationFailure[] {
  if (Buffer.isBuffer(value)) {
    return []
  }
  return [new NotBufferFail(`Must be an Buffer`, value, context)]
}

export abstract class BufferValidator<O = never> extends ValidatorBase<Buffer | O> {
  public constructor(options?: ValidatorBaseOptions) {
    super(options)
    if (options?.optimize !== false) {
      this.optimize()
    }
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'Buffer'
    }
    return `new ${this.constructor.name}(${this.optionsString})`
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateBuffer(value, context)
  }
}

export class RequiredBuffer extends BufferValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options })
  }
}

export class OptionalBuffer extends BufferValidator<undefined> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}

export class NullableBuffer extends BufferValidator<null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, nullable: true })
  }
}

export class OptionalNullableBuffer extends BufferValidator<undefined | null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false, nullable: true })
  }
}