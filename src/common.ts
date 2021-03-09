import { ValidationErrorContext, ValidationFailure, ValidationsError } from './errors'

// https://stackoverflow.com/questions/51651499/typescript-what-is-a-naked-type-parameter
// https://2ality.com/2019/07/testing-static-types.html
// Wrapping the types in an tuple force a specific type instead of allow any in the union
export type AssertEqual<T, Expected> = [T, Expected] extends [Expected, T] ? true : never

// TODO: Give better name
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
  required?: boolean
}

export interface Validator {
  validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[]
  codeGen(valueRef: string, validatorRef: string, id: () => number, context?: ValidationErrorContext): CodeGenResult
}

export abstract class ValidatorBase<T> implements Validator {
  public schema?: unknown
  protected codeGenId = 1
  private originalValidate: ((value: unknown, context?: ValidationErrorContext) => ValidationFailure[]) | null = null

  // TODO: implement convert JSON to validate object

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
    const contextStr = context
      ? `, { key: (context && context.key ? \`\${context.key}['${context.key}']\` : \`${context.key}\`) }`
      : ', context'
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
      this.originalValidate = this.originalValidate ? this.originalValidate : this.validate.bind(this)
      const validateFunction = functionGenerator(imports, { schema: this.schema, validate: this.originalValidate })
      this.validate = validateFunction
      return validateFunction
    } catch (e) {
      throw new Error(`Failed to compile optimized function(${e.message}):\n${functionBody}`)
    }
  }

  public abstract validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[]
}
