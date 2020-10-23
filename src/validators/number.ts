import { CodeGenResult, ValidatorBase, ValidatorOptions } from '../common'
import { NotNumberFail, OutOfRangeFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function validateNumber(
  value: unknown,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): ValidationFailure[] {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return [new NotNumberFail(`Must be a Number (received "${value}")`, context)]
  }
  if (value < min || value > max) {
    return [new OutOfRangeFail(`Must be between ${min} and ${max} (received "${value}")`, context)]
  }
  return []
}

export class NumberValidator<O = never> extends ValidatorBase<number | O> {
  private min: number
  private max: number
  private required: boolean

  public constructor(
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    options?: ValidatorOptions,
    required = true
  ) {
    super()
    this.min = min
    this.max = max
    this.required = required
    if (options?.optimize) {
      this.validate = this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateNumber(value, this.min, this.max, context)
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
      `  if (typeof ${localValueRef} === 'number' && !isNaN(${localValueRef} ) && isFinite(${localValueRef})) {`,
      `    if (${localValueRef} < ${this.min} || ${localValueRef} > ${this.max}) {`,
      `      errors.push(new OutOfRangeFail(\`Must be between ${this.min} and ${this.max} (received "\${${localValueRef}}")\`${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotNumberFail(\`Must be a Number (received "\${${localValueRef}}")\`${contextStr}))`,
      `  }`,
      ...(this.required ? [
        `} else {`,
        `  errors.push(new RequiredError(\`Is required\`${contextStr}))`] : []),
        '}'
    ]
    return [
      {
        OutOfRangeFail: OutOfRangeFail,
        NotNumberFail: NotNumberFail,
        RequiredError: RequiredFail
      },
      declarations,
      code
    ]
  }
}

export class RequiredNumber extends NumberValidator {
  private validatorType: 'RequiredNumber' = 'RequiredNumber'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, options)
  }
}

export class OptionalNumber extends NumberValidator<undefined | null> {
  private validatorType: 'OptionalNumber' = 'OptionalNumber'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, options, false)
  }
}

// Number is used, so using NumberFunc, is this okay?
export function NumberFunc(min: number, max: number, required: false): OptionalNumber
export function NumberFunc(min: number, max: number, required?: true): RequiredNumber
export function NumberFunc(
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  required = true
): OptionalNumber | RequiredNumber {
  return required ? new RequiredNumber(min, max) : new OptionalNumber(min, max)
}
