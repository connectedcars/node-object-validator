import { CodeGenResult, ValidatorBase, ValidatorOptions } from '../common'
import { NotExactStringError, RequiredError, ValidationErrorContext } from '../errors'

export function validateExactString(value: unknown, expected: string, context?: ValidationErrorContext): Error[] {
  if (value !== expected) {
    return [new NotExactStringError(`Must strictly equal "${expected}" (received "${value}")`, context)]
  }
  return []
}

export class ExactStringValidator<O = never> extends ValidatorBase<string | O> {
  private expected: string
  private required: boolean

  public constructor(expected: string, options?: ValidatorOptions, required = true) {
    super()
    this.required = required
    this.expected = expected
    if (options?.optimize) {
      this.validate = this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return this.required ? [new RequiredError(`Is required`, context)] : []
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
    // prettier-ignore
    const code = [
      `if (${valueRef} != null) {`,
      `  if (${valueRef} !== ${expectedStr}) {`,
      `    errors.push(new NotExactStringError(\`Must strictly equal ${expectedStr} (received "\${${valueRef}}")\`${contextStr}))`,
      `  }`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(new RequiredError(\`Is required\`${contextStr}))`] : []),
      '}'
    ]
    return [code, [], {}]
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
