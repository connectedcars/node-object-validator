import { CodeGenResult, ValidatorBase, ValidatorOptions } from '../common'
import { NotFloatFail, OutOfRangeFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function isFloat(
  value: unknown,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): value is number {
  const errors = validateFloat(value, min, max, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateFloat(
  value: unknown,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): ValidationFailure[] {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return [new NotFloatFail(`Must be a float (received "${value}")`, context)]
  }
  if (value < min || value > max) {
    return [new OutOfRangeFail(`Must be between ${min} and ${max} (received "${value}")`, context)]
  }
  return []
}

export class FloatValidator<O = never> extends ValidatorBase<number | O> {
  private min: number
  private max: number
  private required: boolean

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super()
    this.min = min
    this.max = max
    const mergedOptions = { required: true, optimize: false, ...options }
    this.required = mergedOptions.required
    if (mergedOptions.optimize) {
      this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateFloat(value, this.min, this.max, context)
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
      `    errors.push(new NotFloatFail(\`Must be a float (received "\${${localValueRef}}")\`${contextStr}))`,
      `  }`,
      ...(this.required ? [
        `} else {`,
        `  errors.push(new RequiredError(\`Is required\`${contextStr}))`] : []),
        '}'
    ]
    return [
      {
        OutOfRangeFail: OutOfRangeFail,
        NotFloatFail: NotFloatFail,
        RequiredError: RequiredFail
      },
      declarations,
      code
    ]
  }
}

export class RequiredFloat extends FloatValidator {
  private validatorType: 'RequiredFloat' = 'RequiredFloat'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: true })
  }
}

export class OptionalFloat extends FloatValidator<undefined | null> {
  private validatorType: 'OptionalFloat' = 'OptionalFloat'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}
