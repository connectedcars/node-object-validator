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

  public isValid<UT extends T = T>(obj: unknown): obj is UT {
    const errors = this.validate(obj)
    return errors.length === 0
  }

  public isType<UT extends T = T>(obj: unknown, errors: ValidationFailure[]): obj is UT {
    return errors.length === 0
  }

  public cast<UT extends T = T>(obj: unknown): UT {
    const errors = this.validate(obj)
    if (this.isType<UT>(obj, errors)) {
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
    const contextStr = context ? `, { key: \`${context.key}\` }` : ', context'
    const validatorName = `validator${id()}`
    const declarations = [`const ${validatorName} = ${validatorRef}`]
    const code = [`errors.push(...${validatorName}.validate(${valueRef}${contextStr}))`]
    return [{}, declarations, code]
  }

  public optimize(): (value: unknown) => ValidationFailure[] {
    const [imports, declarations, code] = this.codeGen('value', 'schema')
    const functionBody = [
      ...Object.keys(imports).map(i => `const ${i} = imports['${i}']`),
      ...declarations,
      `return (value, context) => {`,
      `  const generatedFunction = true`,
      `  const errors = []`,
      ...code.map(l => `  ${l}`),
      `  return errors`,
      `}`
    ].join('\n')

    try {
      const functionGenerator = new Function('imports', 'schema', functionBody)
      const validateFunction = functionGenerator(imports, { schema: this.schema, validate: this.validate })
      return validateFunction
    } catch (e) {
      throw new Error(`Failed to compile optimized function(${e.message}):\n${functionBody}`)
    }
  }

  public abstract validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[]
}
