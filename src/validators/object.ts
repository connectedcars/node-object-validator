import { ValidatorBase } from '../common'
import { NotObjectError, RequiredError, ValidationErrorContext } from '../errors'
import { ObjectSchema, SchemaToType } from '../types'

export function isObject(value: unknown): value is { [key: string]: unknown } {
  return value !== null && typeof value === 'object'
}

export function validateObject<T extends ObjectSchema = ObjectSchema, O = never>(
  schema: RequiredObject<T> | OptionalObject<T> | ObjectValidator<T, O>,
  value: unknown,
  context?: ValidationErrorContext
): Error[] {
  const errors: Error[] = []
  if (!isObject(value)) {
    errors.push(new NotObjectError(`Must be an object (received "${value}")`, context))
    return errors
  }
  for (const key of Object.keys(schema.schema)) {
    const validator = schema.schema[key]
    const keyName = context?.key ? `${context.key}['${key}']` : key
    errors.push(...validator.validate(value[key], { key: keyName }))
  }
  return errors
}

/**
 * @typedef ObjectValidatorOptions
 * @property {boolean} [optimize=true] Generate an optimized function for doing the validation (default: true)
 */
export type ObjectValidatorOptions = {
  /**
   * Generate an optimized function for doing the validation (default: false)
   */
  optimize?: boolean
}

export class ObjectValidator<T extends ObjectSchema = ObjectSchema, O = never> extends ValidatorBase<
  SchemaToType<T> | O
> {
  public schema: T
  private required: boolean

  public constructor(schema: T, options?: ObjectValidatorOptions, required = true) {
    super()
    this.schema = schema
    this.required = required
    if (options?.optimize) {
      this.validate = this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return this.required ? [new RequiredError(`Is required`, context)] : []
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
  ): [string[], string[]] {
    const objValueRef = `objValue${id()}`
    const schemaRef = `scheme${id()}`
    const sLines = [`const ${schemaRef} = ${validatorRef}.schema`]
    // prettier-ignore
    const vLines = [
      `const ${objValueRef} = ${valueRef}`,
      `if (${objValueRef} != null) {`,
      `  if (typeof ${objValueRef} === 'object'){`
    ]
    for (const key of Object.keys(this.schema)) {
      const validator = this.schema[key]
      const propName = context?.key ? `${context.key}['${key}']` : key
      const [propVLines, propSLines] = validator.codeGen(`${objValueRef}['${key}']`, `${schemaRef}['${key}']`, id, {
        key: propName
      })
      sLines.push(...propSLines)
      vLines.push(...propVLines.map(l => `    ${l}`))
    }
    // prettier-ignore
    vLines.push(
      `  } else {`,
      `    errors.push(new NotObjectError(\`Must be an object (received "\${${valueRef}}")\`` +
        (context ? `, ${JSON.stringify(context)}))` : '))'),
      `  }`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(new RequiredError(\`Is required\``+ (context ? `, ${JSON.stringify(context)}))` : '))')] : []),
      '}'
    )

    return [vLines, sLines]
  }
}

export class RequiredObject<T extends ObjectSchema = ObjectSchema> extends ObjectValidator<T> {
  private validatorType: 'RequiredObject' = 'RequiredObject'
  public constructor(schema: T) {
    super(schema)
  }
}

export class OptionalObject<T extends ObjectSchema = ObjectSchema> extends ObjectValidator<T, null | undefined> {
  private validatorType: 'OptionalObject' = 'OptionalObject'
  public constructor(schema: T) {
    super(schema, {}, false)
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
