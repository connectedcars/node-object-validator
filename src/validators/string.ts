import { CodeGenResult, ValidatorBase, ValidatorBaseOptions, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotStringFail, RequiredFail, ValidationFailure, WrongLengthFail } from '../errors'

export function isString(
  value: unknown,
  minLength = 0,
  maxLength: number = Number.MAX_SAFE_INTEGER,
  context?: string
): value is string {
  const errors = validateString(value, minLength, maxLength, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateString(
  value: unknown,
  minLength = 0,
  maxLength: number = Number.MAX_SAFE_INTEGER,
  context?: string
): ValidationFailure[] {
  if (typeof value !== 'string') {
    return [new NotStringFail(`Must be a string`, value, context)]
  }
  if ((minLength !== 0 && value.length < minLength) || value.length > maxLength) {
    return [new WrongLengthFail(`Must contain between ${minLength} and ${maxLength} characters`, value, context)]
  }
  return []
}

export abstract class StringValidator<O = never> extends ValidatorBase<string | O> {
  private minLength: number
  private maxLength: number

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorBaseOptions) {
    super(options)
    this.minLength = minLength
    this.maxLength = maxLength
    if (options?.optimize !== false) {
      this.optimize()
    }
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: string,
    earlyFail?: boolean
  ): CodeGenResult {
    const contextStr = context ? `, \`${context}\`` : ', context'
    const localValueRef = `value${id()}`
    const declarations: string[] = []
    // prettier-ignore
    const code: string[] = [
      `const ${localValueRef} = ${valueRef}`,
      ...this.nullCheckWrap([
      `  if (typeof ${localValueRef} === 'string') {`,
      `    if (${this.minLength ? `${localValueRef}.length < ${this.minLength} || ` : '' }${localValueRef}.length > ${this.maxLength}) {`,
      `      errors.push(new WrongLengthFail(\`Must contain between ${this.minLength} and ${this.maxLength} characters\`, ${localValueRef}${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotStringFail(\`Must be a string\`, ${localValueRef}${contextStr}))`,
      `  }`,
      ], localValueRef, contextStr),
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : [])
    ]
    return [
      {
        WrongLengthFail: WrongLengthFail,
        NotStringFail: NotStringFail,
        RequiredFail: RequiredFail
      },
      declarations,
      code
    ]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'string'
    }
    const minLengthStr = this.minLength !== 0 || this.maxLength !== Number.MAX_SAFE_INTEGER ? `${this.minLength}` : ''
    const maxLengthStr = this.maxLength !== Number.MAX_SAFE_INTEGER ? `, ${this.maxLength}` : ''
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${minLengthStr}${maxLengthStr}${optionsStr})`
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateString(value, this.minLength, this.maxLength, context)
  }
}

export class RequiredString extends StringValidator {
  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(minLength, maxLength, { ...options, required: true })
  }
}

export class OptionalString extends StringValidator<undefined> {
  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(minLength, maxLength, { ...options, required: false })
  }
}

export class NullableString extends StringValidator<null> {
  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(minLength, maxLength, { ...options, nullable: true })
  }
}

export class OptionalNullableString extends StringValidator<undefined | null> {
  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(minLength, maxLength, { ...options, required: false, nullable: true })
  }
}
