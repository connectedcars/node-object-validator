import { CodeGenResult, ValidatorBase, ValidatorOptions } from '../common'
import { NotObjectFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'
import { ObjectSchema, SchemaToType } from '../types'

export function isObject(value: unknown): value is { [key: string]: unknown } {
  return value !== null && typeof value === 'object'
}

export function validateObject<T extends ObjectSchema = ObjectSchema, O = never>(
  schema: RequiredObject<T> | OptionalObject<T> | ObjectValidator<T, O>,
  value: unknown,
  context?: ValidationErrorContext
): ValidationFailure[] {
  const errors: ValidationFailure[] = []
  if (!isObject(value)) {
    errors.push(new NotObjectFail(`Must be an object (received "${value}")`, context))
    return errors
  }
  for (const key of Object.keys(schema.schema)) {
    const validator = schema.schema[key]
    const keyName = context?.key ? `${context.key}['${key}']` : key
    errors.push(...validator.validate(value[key], { key: keyName }))
  }
  return errors
}

export class ObjectValidator<T extends ObjectSchema = ObjectSchema, O = never> extends ValidatorBase<
  SchemaToType<T> | O
> {
  public schema: T
  private required: boolean

  public constructor(schema: T, options?: ValidatorOptions, required = true) {
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
    return validateObject(this, value, context)
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: ValidationErrorContext
  ): CodeGenResult {
    const contextStr = context ? `, { key: \`${context.key}\` }` : ''
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
      `  if (typeof ${objValueRef} === 'object'){`
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

export class RequiredObject<T extends ObjectSchema = ObjectSchema> extends ObjectValidator<T> {
  private validatorType: 'RequiredObject' = 'RequiredObject'
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, options)
  }
}

export class OptionalObject<T extends ObjectSchema = ObjectSchema> extends ObjectValidator<T, null | undefined> {
  private validatorType: 'OptionalObject' = 'OptionalObject'
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, options, false)
  }
}

export function TypedObject<T extends ObjectSchema = ObjectSchema>(
  schema: ObjectSchema,
  required?: false
): OptionalObject<T>
export function TypedObject<T extends ObjectSchema = ObjectSchema>(
  schema: ObjectSchema,
  required: true
): RequiredObject<T>
export function TypedObject<T extends ObjectSchema = ObjectSchema>(
  schema: T,
  required = false
): OptionalObject<T> | RequiredObject<T> {
  return required ? new RequiredObject(schema) : new OptionalObject(schema)
}
