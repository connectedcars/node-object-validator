import { CodeGenResult, ValidatorBase, ValidatorOptions } from '../common'
import { NotStringFail, RequiredFail, ValidationErrorContext, ValidationFailure, WrongLengthFail } from '../errors'

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
  private required: boolean

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions, required = true) {
    super()
    this.minLength = minLength
    this.maxLength = maxLength
    this.required = required
    if (options?.optimize) {
      this.validate = this.optimize()
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
  private validatorType: 'RequiredString' = 'RequiredString'

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(minLength, maxLength, options)
  }
}

export class OptionalString extends StringValidator<undefined | null> {
  private validatorType: 'OptionalString' = 'OptionalString'

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(minLength, maxLength, options, false)
  }
}

export function StringValue(minLength: number, maxLength: number, required: false): OptionalString
export function StringValue(minLength: number, maxLength: number, required?: true): RequiredString
export function StringValue(
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  required = true
): OptionalString | RequiredString {
  return required ? new RequiredString(minLength, maxLength) : new OptionalString(minLength, maxLength)
}
