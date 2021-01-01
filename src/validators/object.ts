import { CodeGenResult, Validator, ValidatorBase, ValidatorOptions } from '../common'
import { NotObjectFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

// TODO: Fail on empty object if the scheme has one required property

// TODO: Add isObject(scheme, etc.) function

function isObjectType(value: unknown): value is { [key: string]: unknown } {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function validateObject(
  schema: Record<string, Validator>,
  value: unknown,
  context?: ValidationErrorContext
): ValidationFailure[] {
  const errors: ValidationFailure[] = []
  if (!isObjectType(value)) {
    errors.push(new NotObjectFail(`Must be an object (received "${value}")`, context))
    return errors
  }
  for (const key of Object.keys(schema)) {
    const validator = schema[key]
    const keyName = context?.key ? `${context.key}['${key}']` : key
    errors.push(...validator.validate(value[key], { key: keyName }))
  }
  return errors
}

export class ObjectValidator<T extends Record<string, unknown>, O = never> extends ValidatorBase<T | O> {
  public schema: Record<string, Validator>
  private required: boolean

  public constructor(schema: Record<string, Validator>, options?: ValidatorOptions, required = true) {
    super()
    this.schema = schema
    this.required = required
    if (options?.optimize) {
      this.validate = this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateObject(this.schema, value, context)
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
    const objValueRef = `objValue${id()}`
    const schemaRef = `scheme${id()}`
    let imports: { [key: string]: unknown } = {
      NotObjectError: NotObjectFail,
      RequiredError: RequiredFail
    }
    const declarations = [`const ${schemaRef} = ${validatorRef}.schema`]

    // prettier-ignore
    const code = [
      `const ${objValueRef} = ${valueRef}`,
      `if (${objValueRef} != null) {`,
      `  if (typeof ${objValueRef} === 'object' && !Array.isArray(${objValueRef})){`
    ]
    for (const key of Object.keys(this.schema)) {
      const validator = this.schema[key]
      const propName = context?.key ? `${context.key}['${key}']` : key
      const [propImports, propDeclarations, propCode] = validator.codeGen(
        `${objValueRef}['${key}']`,
        `${schemaRef}['${key}']`,
        id,
        {
          key: propName
        }
      )
      imports = { ...imports, ...propImports }
      declarations.push(...propDeclarations)
      code.push(...propCode.map(l => `    ${l}`))
    }
    // prettier-ignore
    code.push(
      `  } else {`,
      `    errors.push(new NotObjectError(\`Must be an object (received "\${${valueRef}}")\`${contextStr}))`,
      `  }`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(new RequiredError(\`Is required\`${contextStr}))`] : []),
      '}'
    )

    return [imports, declarations, code]
  }
}

export class RequiredObject<T extends Record<string, unknown>> extends ObjectValidator<T> {
  private validatorType: 'RequiredObject' = 'RequiredObject'
  public constructor(schema: Record<string, Validator>, options?: ValidatorOptions) {
    super(schema, options)
  }
}

export class OptionalObject<T extends Record<string, unknown>> extends ObjectValidator<T, null | undefined> {
  private validatorType: 'OptionalObject' = 'OptionalObject'
  public constructor(schema: Record<string, Validator>, options?: ValidatorOptions) {
    super(schema, options, false)
  }
}
