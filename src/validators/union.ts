import { CodeGenResult, Validator, ValidatorBase, ValidatorOptions } from '../common'
import { RequiredFail, UnionFail, ValidationErrorContext, ValidationFailure } from '../errors'
import { ExactStringValidator } from './exact-string'

export function isUnion<T>(schema: Validator[], value: unknown, context?: ValidationErrorContext): value is T {
  const errors = validateUnion(schema, value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateUnion(
  schema: Validator[],
  value: unknown,
  context?: ValidationErrorContext,
  optimized?: boolean
): ValidationFailure[] {
  const errors: ValidationFailure[] = []
  for (const [index, validator] of schema.entries()) {
    const propName = `${context?.key || ''}(${index})`
    const currentErrors = validator.validate(value, { key: propName }, optimized)
    if (currentErrors.length === 0) {
      return []
    } else {
      errors.push(
        new UnionFail(`Union entry failed validation with ${currentErrors.length} errors`, currentErrors, {
          key: propName
        })
      )
    }
  }
  return errors
}

export class UnionValidator<T, O = never> extends ValidatorBase<T | O> {
  public schema: Validator[]

  public constructor(schema: Validator[], options?: ValidatorOptions) {
    super(options)
    this.schema = schema
    if (options?.optimize) {
      this.optimize()
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
    const contextStr = context?.key ? `, { key: \`${context.key}\` }` : ', context'
    const unionValueRef = `unionValue${id()}`
    const schemaRef = `scheme${id()}`
    let imports: { [key: string]: unknown } = {
      RequiredError: RequiredFail,
      UnionFail: UnionFail
    }
    const declarations = [`const ${schemaRef} = ${validatorRef}.schema`]

    // prettier-ignore
    const code = [
      `const ${unionValueRef} = ${valueRef}`,
      `const ${unionValueRef}orgErrors = errors`,
      `let ${unionValueRef}Errors = []`,
      `if (${unionValueRef} != null) {`,
      `  let errors = []`,
    ]
    for (const [index, validator] of this.schema.entries()) {
      const propName = context?.key ? `${context.key}('${index}')` : `(${index})`
      const [propImports, propDeclarations, propCode] = validator.codeGen(unionValueRef, `${schemaRef}[${index}]`, id, {
        key: propName
      })
      imports = { ...imports, ...propImports }
      declarations.push(...propDeclarations)
      if (index > 0) {
        code.push(`  if (${unionValueRef}Errors.length > 0) {`)
        code.push(...propCode.map(l => `    ${l}`))
      } else {
        code.push(...propCode.map(l => `  ${l}`))
      }

      if (index > 0) {
        code.push(`  }`)
      }
      // prettier-ignore
      code.push(
        `  if (errors.length > 0) {`,
        `    ${unionValueRef}Errors.push(`,
        `      new UnionFail(\`Union entry failed validation with \${errors.length} errors\`, errors, { key: '${propName}' })`,
        '    )',
        `  } else {`,
        `    ${unionValueRef}Errors = []`,
        `  }`,
        `  errors = []`
      )
    }
    // prettier-ignore
    code.push(
      `  ${unionValueRef}orgErrors.push(...${unionValueRef}Errors)`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(new RequiredError(\`Is required\`${contextStr}))`] : []),
      '}',

    )

    return [imports, declarations, code]
  }

  protected validateValue(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    return validateUnion(this.schema, value, context)
  }
}

export class RequiredUnion<T> extends UnionValidator<T> {
  public constructor(schema: Validator[], options?: ValidatorOptions) {
    super(schema, { ...options, required: true })
  }
}

export class OptionalUnion<T> extends UnionValidator<T, undefined | null> {
  public constructor(schema: Validator[], options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}

export class EnumValidator<T, O = never> extends UnionValidator<T, O> {
  public constructor(schema: string[], options?: ValidatorOptions) {
    super(
      schema.map(e => new ExactStringValidator(e)),
      options
    )
  }
}

export class RequiredEnum<T> extends EnumValidator<T> {
  public constructor(schema: string[], options?: ValidatorOptions) {
    super(schema, { ...options, required: true })
  }
}

export class OptionalEnum<T> extends EnumValidator<T, undefined | null> {
  public constructor(schema: string[], options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}
