import { CodeGenResult, ValidatorBase, ValidatorOptions } from '../common'
import { NotStringFail, RequiredFail, ValidationErrorContext, ValidationFailure, WrongLengthFail } from '../errors'

export function isString(
  value: unknown,
  minLength = 0,
  maxLength: number = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
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
  context?: ValidationErrorContext
): ValidationFailure[] {
  if (typeof value !== 'string') {
    return [new NotStringFail(`Must be a string (received "${value}")`, context)]
  }
  if ((minLength !== 0 && value.length < minLength) || value.length > maxLength) {
    return [
      new WrongLengthFail(
        `Must contain between ${minLength} and ${maxLength} characters (received "${value}")`,
        context
      )
    ]
  }
  return []
}

export class StringValidator<O = never> extends ValidatorBase<string | O> {
  private minLength: number
  private maxLength: number

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(options)
    this.minLength = minLength
    this.maxLength = maxLength
    if (options?.optimize) {
      this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateString(value, this.minLength, this.maxLength, context)
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: ValidationErrorContext
  ): CodeGenResult {
    const contextStr = context ? `, { key: \`${context.key}\` }` : ', context'
    const localValueRef = `value${id()}`
    const declarations: string[] = []
    // prettier-ignore
    const code: string[] = [
      `const ${localValueRef} = ${valueRef}`,
      `if (${localValueRef} != null) {`,
      `  if (typeof ${localValueRef} === 'string') {`,
      `    if (${this.minLength ? `${localValueRef}.length < ${this.minLength} || ` : '' }${localValueRef}.length > ${this.maxLength}) {`,
      `      errors.push(new WrongLengthFail(\`Must contain between ${this.minLength} and ${this.maxLength} characters (received "\${${localValueRef}}")\`${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotStringFail(\`Must be a string (received "\${${localValueRef}}")\`${contextStr}))`,
      `  }`,
      ...(this.required ? [
        `} else {`,
        `  errors.push(new RequiredError(\`Is required\`${contextStr}))`] : []),
        '}'
    ]
    return [
      {
        WrongLengthFail: WrongLengthFail,
        NotStringFail: NotStringFail,
        RequiredError: RequiredFail
      },
      declarations,
      code
    ]
  }
}

export class RequiredString extends StringValidator {
  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(minLength, maxLength, { ...options, required: true })
  }
}

export class OptionalString extends StringValidator<undefined | null> {
  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(minLength, maxLength, { ...options, required: false })
  }
}
