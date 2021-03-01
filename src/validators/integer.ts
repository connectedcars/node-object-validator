import { CodeGenResult, ValidatorBase, ValidatorOptions } from '../common'
import { NotIntegerFail, OutOfRangeFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function validateInteger(
  value: unknown,
  min: number,
  max: number,
  context?: ValidationErrorContext
): ValidationFailure[] {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return [new NotIntegerFail(`Must be an integer (received "${value}")`, context)]
  }
  if (value < min || value > max) {
    return [new OutOfRangeFail(`Must be between ${min} and ${max} (received "${value}")`, context)]
  }
  return []
}

export class IntegerValidator<O = never> extends ValidatorBase<number | O> {
  private min: number
  private max: number
  private required: boolean

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super()
    this.min = min
    this.max = max
    const mergedOptions = { required: true, optimize: false, ...options }
    this.required = mergedOptions.required
    if (mergedOptions.optimize) {
      this.validate = this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateInteger(value, this.min, this.max, context)
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
      `  if (typeof ${localValueRef} === 'number' && Number.isInteger(${localValueRef})) {`,
      `    if (${localValueRef} < ${this.min} || ${localValueRef} > ${this.max}) {`,
      `      errors.push(new OutOfRangeFail(\`Must be between ${this.min} and ${this.max} (received "\${${localValueRef}}")\`${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotIntegerFail(\`Must be an integer (received "\${${localValueRef}}")\`${contextStr}))`,
      `  }`,
      ...(this.required ? [
        `} else {`,
        `  errors.push(new RequiredError(\`Is required\`${contextStr}))`] : []),
        '}'
    ]
    return [
      {
        OutOfRangeFail: OutOfRangeFail,
        NotIntegerFail: NotIntegerFail,
        RequiredError: RequiredFail
      },
      declarations,
      code
    ]
  }
}

export class RequiredInteger extends IntegerValidator {
  private validatorType: 'RequiredInteger' = 'RequiredInteger'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: true })
  }
}

export class OptionalInteger extends IntegerValidator<undefined | null> {
  private validatorType: 'OptionalInteger' = 'OptionalInteger'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}
