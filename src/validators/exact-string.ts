import { CodeGenResult, ValidatorBase, ValidatorOptions } from '../common'
import { NotExactStringFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function validateExactString(
  value: unknown,
  expected: string,
  context?: ValidationErrorContext
): ValidationFailure[] {
  if (value !== expected) {
    return [new NotExactStringFail(`Must strictly equal "${expected}" (received "${value}")`, context)]
  }
  return []
}

export class ExactStringValidator<O = never> extends ValidatorBase<string | O> {
  private expected: string
  private required: boolean

  public constructor(expected: string, options?: ValidatorOptions, required = true) {
    super()
    this.expected = expected
    this.required = required
    if (options?.optimize) {
      this.validate = this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateExactString(value, this.expected, context)
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: ValidationErrorContext
  ): CodeGenResult {
    const expectedStr = JSON.stringify(this.expected)
    const contextStr = context ? `, ${JSON.stringify(context)}` : ''
    const localValueRef = `value${id()}`
    const localRequiredErrorRef = `requiredError${id()}`
    const declarations = [`const ${localRequiredErrorRef} = new RequiredError(\`Is required\`${contextStr})`]
    // prettier-ignore
    const code = [
      `const ${localValueRef} = ${valueRef}`,
      `if (${localValueRef} != null) {`,
      `  if (${localValueRef} !== ${expectedStr}) {`,
      `    errors.push(new NotExactStringError(\`Must strictly equal ${expectedStr} (received "\${${localValueRef}}")\`${contextStr}))`,
      `  }`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(${localRequiredErrorRef})`] : []),
      '}'
    ]
    return [
      {
        NotExactStringError: NotExactStringFail,
        RequiredError: RequiredFail
      },
      declarations,
      code
    ]
  }
}

export class RequiredExactString extends ExactStringValidator {
  private validatorType: 'RequiredExactString' = 'RequiredExactString'

  public constructor(expected: string) {
    super(expected)
  }
}

export class OptionalExactString extends ExactStringValidator<undefined | null> {
  private validatorType: 'OptionalExactString' = 'OptionalExactString'

  public constructor(expected: string) {
    super(expected, {}, false)
  }
}

export function ExactString(expectedStr: string, required?: false): OptionalExactString
export function ExactString(expectedStr: string, required: true): RequiredExactString
export function ExactString(expectedStr: string, required = false): OptionalExactString | RequiredExactString {
  return required ? new RequiredExactString(expectedStr) : new OptionalExactString(expectedStr)
}
