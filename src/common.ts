import { ValidationErrorContext, ValidationFailure, ValidationsError } from './errors'
import { ObjectSchema, ValidatorTypes } from './types'

export function isValidType<T>(value: unknown, errors: ValidationFailure[]): value is T {
  return errors.length === 0
}

export type CodeGenResult = [{ [key: string]: unknown }, string[], string[]]

/**
 * @typedef ValidatorOptions
 * @property {boolean} [optimize=true] Generate an optimized function for doing the validation (default: true)
 */
export type ValidatorOptions = {
  /**
   * Generate an optimized function for doing the validation (default: false)
   */
  optimize?: boolean
}

export abstract class ValidatorBase<T> {
  public schema?: ValidatorTypes | ObjectSchema
  public type!: T
  protected codeGenId = 1

  public isValid(obj: unknown): obj is T {
    const errors = this.validate(obj)
    return errors.length === 0
  }

  public isType(obj: unknown, errors: ValidationFailure[]): obj is T {
    return errors.length === 0
  }

  public cast(obj: unknown): T {
    const errors = this.validate(obj)
    if (this.isType(obj, errors)) {
      return obj
    } else {
      throw new ValidationsError('One of more validations failed', errors)
    }
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: ValidationErrorContext
  ): CodeGenResult {
    const validatorName = `validator${id()}`
    const declarations = [`const ${validatorName} = ${validatorRef}`]
    const code = [
      `errors.push(...${validatorName}.validate(${valueRef}` + (context ? `, ${JSON.stringify(context)}))` : '))')
    ]
    return [{}, declarations, code]
  }

  public optimize(): (value: unknown) => ValidationFailure[] {
    const [imports, declarations, code] = this.codeGen('value', 'schema')
    const functionBody = [
      ...Object.keys(imports).map(i => `const ${i} = imports['${i}']`),
      ...declarations,
      `return (value) => {`,
      `  const generatedFunction = true`,
      `  const errors = []`,
      ...code.map(l => `  ${l}`),
      `  return errors`,
      `}`
    ].join('\n')

    const functionGenerator = new Function('imports', 'schema', functionBody)
    const validateFunction = functionGenerator(imports, this)
    return validateFunction
  }

  public abstract validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[]
}
