import {
  addTypeDef,
  ExactStringValidator,
  isPlainObject,
  ObjectValidator,
  RequiredDate,
  RequiredDateTime,
  RequiredExactString,
  RequiredFloat,
  RequiredFloatString,
  RequiredInteger,
  RequiredIntegerString,
  serdeDecoratorsString,
  toPascalCase,
  validateRustTypeName
} from '..'
import { CodeGenResult, ValidatorBase, ValidatorExportOptions, ValidatorOptions } from '../common'
import {
  NotDatetimeOrDateFail,
  NotFloatOrFloatStringFail,
  NotIntegerOrIntegerStringFail,
  NotObjectFail,
  RequiredFail,
  UnionFail,
  ValidationFailure
} from '../errors'

export function isUnion<T extends ValidatorBase[]>(
  schema: T,
  value: unknown,
  context?: string
): value is T[number]['tsType'] {
  const errors = validateUnion(schema, value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

function findUnionKey(schema: ObjectValidator[]): string | null {
  let unionKey: string | null = null
  for (const key of Object.keys(schema[0].schema)) {
    const firstValidator = schema[0].schema[key]
    if (firstValidator instanceof RequiredExactString) {
      const seenExpected: string[] = [firstValidator.expected]
      for (let i = 1; i < schema.length; i++) {
        const validator = schema[i].schema[key]
        if (validator instanceof RequiredExactString) {
          if (seenExpected.includes(validator.expected)) {
            break
          }
          seenExpected.push(validator.expected)
        }
      }
      if (seenExpected.length === schema.length) {
        unionKey = key
        break
      }
    }
  }
  return unionKey
}

export interface ValidateUnionOptions extends ValidatorOptions {
  every?: boolean
}

export function validateUnion(
  schema: ValidatorBase[],
  value: unknown,
  context?: string,
  options?: ValidateUnionOptions
): ValidationFailure[] {
  const errors: ValidationFailure[] = []

  if (!options?.every && schema.length > 1 && schema.every((v): v is ObjectValidator => v instanceof ObjectValidator)) {
    const unionKey = findUnionKey(schema)
    if (unionKey !== null) {
      if (!isPlainObject(value)) {
        return [new NotObjectFail(`Must be an object`, value, context)]
      }
      for (const validator of schema) {
        const errors = validator.schema[unionKey].validate(value[unionKey])
        if (errors.length === 0) {
          return validator.validate(value, context, options)
        }
      }
      return [new UnionFail(`Union key '${unionKey}' did not match`, [], value, context)]
    }
  }

  for (const [index, validator] of schema.entries()) {
    const propName = `${context || ''}(${index})`
    const currentErrors = validator.validate(value, propName, { optimize: false, earlyFail: false, ...options })
    if (currentErrors.length === 0) {
      return []
    } else {
      errors.push(
        new UnionFail(
          `Union entry failed validation with ${currentErrors.length} errors`,
          currentErrors,
          value,
          propName
        )
      )
      if (options?.earlyFail) {
        return errors
      }
    }
  }
  return errors
}

export interface UnionValidatorOptions extends ValidatorOptions {
  every?: boolean
}

export abstract class UnionValidator<T extends ValidatorBase[], O = never> extends ValidatorBase<
  T[number]['tsType'] | O
> {
  public schema: T

  private every: boolean

  public constructor(schema: T, options?: UnionValidatorOptions & ValidatorOptions) {
    super(options)
    this.schema = schema
    this.every = options?.every ? true : false
    if (options?.optimize !== false) {
      this.optimize(schema)
    }
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: string,
    earlyFail?: boolean
  ): CodeGenResult {
    const contextStr = context ? `,\`${context}\`` : ', context'
    const unionValueRef = `unionValue${id()}`
    const schemaRef = `scheme${id()}`
    let imports: { [key: string]: unknown } = {
      RequiredFail: RequiredFail,
      UnionFail: UnionFail,
      NotObjectFail: NotObjectFail
    }
    const declarations = [`const ${schemaRef} = ${validatorRef}.schema`]

    let unionCode: string[] = []

    // Try to find a common key for the union to skip checking all entries
    let unionKey: string | null = null
    let unionKeyValueRef = ''
    if (
      !this.every &&
      this.schema.length > 1 &&
      this.schema.every((v): v is ObjectValidator => v instanceof ObjectValidator)
    ) {
      unionKey = findUnionKey(this.schema)
      if (unionKey !== null) {
        unionKeyValueRef = `unionKeyValue${id()}`
        unionCode.push(`  const ${unionKeyValueRef} = ${unionValueRef}['${unionKey}']`)
      }
    }

    for (const [index, validator] of this.schema.entries()) {
      const propName = context ? `${context}(${index})` : `(${index})`
      const [propImports, propDeclarations, propCode] = validator.codeGen(
        unionValueRef,
        `${schemaRef}[${index}]`,
        id,
        unionKey ? context : propName
      )
      imports = { ...imports, ...propImports }
      declarations.push(...propDeclarations)

      let entryCode = propCode.map(l => `  ${l}`)

      if (unionKey) {
        const expectedString = (
          (validator as ObjectValidator).schema[unionKey] as ExactStringValidator<''>
        ).expected.replace(/'/g, "\\'")

        // prettier-ignore
        entryCode = [
          `  ${index > 0 ? '} else ' : ''}if (${unionKeyValueRef} === '${expectedString}') {`,
            ...entryCode.map(l => `  ${l}`),
          `    ${unionValueRef}Errors.push(...errors)`,
          ...(index === this.schema.length - 1 ? [
          `  } else {`,
          `     ${unionValueRef}Errors.push(new UnionFail(\`Union key '${unionKey}' did not match\`, [], ${unionValueRef}${contextStr}))`,
          `  }`
          ]: []),
        ]
      } else {
        if (index > 0) {
          // prettier-ignore
          entryCode = [
            `  if (${unionValueRef}Errors.length > 0) {`,
            ...entryCode.map(l => `  ${l}`),
            `  }`
          ]
        }

        // prettier-ignore
        entryCode.push(
          `  if (errors.length > 0) {`,
          `    ${unionValueRef}Errors.push(`,
          `      new UnionFail(\`Union entry failed validation with \${errors.length} errors\`, errors, ${unionValueRef}, \`${propName}\`)`,
          '    )',
          `  } else {`,
          `    ${unionValueRef}Errors = []`,
          `  }`,
          `  errors = []`
        )
      }

      unionCode.push(...entryCode)
    }

    if (unionKey !== null) {
      // prettier-ignore
      unionCode = [
        `  if (typeof ${unionValueRef} === 'object' && !Array.isArray(${unionValueRef})) {`,
        ...unionCode.map(l => `  ${l}`),
        `  } else {`,
        `    ${unionValueRef}Errors.push(new NotObjectFail(\`Must be an object\`, ${unionValueRef}${contextStr}))`,
        `  }`
      ]
    }
    // prettier-ignore
    const code = [
      `const ${unionValueRef} = ${valueRef}`,
      `const ${unionValueRef}orgErrors = errors`,
      `let ${unionValueRef}Errors = []`,
      ...this.nullCheckWrap([
      `  let errors = []`,
      ...unionCode,
      `  ${unionValueRef}orgErrors.push(...${unionValueRef}Errors)`,
      ], unionValueRef, contextStr),
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),
    ]

    return [imports, declarations, code]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types === true) {
      return this.typeString(options)
    } else {
      return this.constructorString(options)
    }
  }

  protected validateValue(value: unknown, context?: string, options?: ValidatorOptions): ValidationFailure[] {
    return validateUnion(this.schema, value, context, { earlyFail: this.earlyFail, every: this.every, ...options })
  }

  private typeString(options?: ValidatorExportOptions): string {
    const language = options?.language ?? 'typescript'
    switch (language) {
      case 'typescript': {
        let typeStr = `${this.schema.map(v => v.toString(options)).join(' | ')}`

        if (this.required === false) {
          typeStr += ` | undefined`
        }
        if (this.nullable === true) {
          typeStr += ` | null`
        }

        return typeStr
      }
      case 'rust': {
        // Checks
        if (options?.typeDefinitions === undefined) {
          throw new Error(`'typeDefinitions' is not set on ${this.toString()}`)
        }
        if (options?.parent === undefined) {
          if (this.typeName === undefined) {
            throw new Error(`'typeName' option is not set, with no parent set on ${this.toString()}`)
          }
        } else {
          if (this.typeName === undefined) {
            if (options.typeNameFromParent === undefined) {
              throw new Error(`'typeName' option is not set, and 'options.objectKey' is not set on ${this.toString()}`)
            } else {
              this.typeName = toPascalCase(options.typeNameFromParent)
            }
          }
        }

        validateRustTypeName(this.typeName, this)

        // Overwrite from parent
        if (options.parent?.hashable === true) {
          this.hashable = true
        }
        if (options.parent?.comparable === true) {
          this.comparable = true
        }
        // Don't support defaultable on union/enums as you would have to explicitly state the default (And Optional does the same job, where the recepient can select the default)

        let unionKey: string | undefined = undefined
        // Tagged union
        if (this.schema.every(val => val instanceof ObjectValidator)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const schema = this.schema as unknown as ObjectValidator<any, any>[]
          // This is okay, even if we have the #[serde(tag = "tagName", content = "value")] pattern, the content will not be ExactString
          unionKey = findUnionKey(schema) ?? undefined
        }

        // Non tagged union
        if (this.schema.every(val => val instanceof ExactStringValidator || val instanceof ObjectValidator)) {
          for (const val of this.schema) {
            if (unionKey === undefined && val instanceof ObjectValidator && Object.keys(val.schema).length > 1) {
              throw new Error(
                `No support for objects in unions/enums which are not a TaggedUnion(or you reused a tag) or which have 1 value (which will become the variant). schema.toString(): ${this.schema.toString()}`
              )
            }
          }
        } else {
          throw new Error(
            `Members of the Union(non tagged) are not an ExactString, schema.toString(): ${this.schema.toString()}`
          )
        }

        const serdeStr = serdeDecoratorsString(this.comparable, this.hashable, this.defaultable, unionKey)

        // For a tagged union the 'line' needs to say the value of the tag as a name. Then the struct. So: Name(NameStruct)
        // BUT it CANNOT contain non structs for the value
        let typeNameFromParent: string | undefined = undefined
        let tagValue: string | undefined = undefined

        const lines = []
        for (const val of this.schema) {
          if (val instanceof ObjectValidator) {
            if (unionKey === undefined) {
              // If unionKey is undefined, we validated earlier that there's 1 element
              tagValue = Object.keys(val.schema)[0]
            } else {
              const tagValidator = val.schema[unionKey]

              if (tagValidator instanceof ExactStringValidator) {
                tagValue = tagValidator.expected

                // If there's only 1 element & it's in a tagged union(unionKey !== undefined) & it's an ExactStringValidator, it's an enum variant without any data (so just the name/variant)
                if (tagValidator.typeName !== undefined || Object.keys(val.schema).length === 1) {
                  typeNameFromParent = tagValidator.typeName
                } else {
                  typeNameFromParent = toPascalCase(tagValidator.expected)
                }
              }
            }
          } else if (val instanceof ExactStringValidator) {
            tagValue = val.expected
          } else {
            throw new Error(
              `Unsupported case for UnionValidator, even though we validated earlier (should not happen). schema.toString(): ${this.schema.toString()})`
            )
          }

          // Override tag/name
          const overrideNameStr = `    #[serde(rename = "${tagValue}")]\n`

          const typeStr = val.toString({
            ...options,
            parent: this,
            taggedUnionKey: unionKey,
            typeNameFromParent: `${typeNameFromParent}Data`
          })

          if (val instanceof ObjectValidator && typeNameFromParent !== undefined) {
            lines.push(`${overrideNameStr}    ${typeNameFromParent}(${typeStr})`)
          } else {
            lines.push(`${overrideNameStr}    ${typeStr}`)
          }
        }

        const typeDef = `${serdeStr}pub enum ${this.typeName} {\n${lines.join(',\n')},\n}\n\n`
        addTypeDef(this.typeName, typeDef, options.typeDefinitions)

        // Reference
        const isOption = !this.required || this.nullable
        return isOption ? `Option<${this.typeName}>` : `${this.typeName}`
      }
      default: {
        throw new Error(`Language: '${options?.language}' unknown`)
      }
    }
  }

  private constructorString(options?: ValidatorExportOptions): string {
    const schemaStr = `[\n${this.schema.map(v => `${v.toString(options).replace(/(^|\n)/g, '$1  ')}`).join(',\n')}\n]`
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${schemaStr}${optionsStr})`
  }
}

export class RequiredUnion<T extends ValidatorBase[]> extends UnionValidator<T> {
  public constructor(schema: T, options?: UnionValidatorOptions) {
    super(schema, { ...options })
  }
}

export class OptionalUnion<T extends ValidatorBase[]> extends UnionValidator<T, undefined> {
  public constructor(schema: T, options?: UnionValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}

export class NullableUnion<T extends ValidatorBase[]> extends UnionValidator<T, null> {
  public constructor(schema: T, options?: UnionValidatorOptions) {
    super(schema, { ...options, nullable: true })
  }
}

export class OptionalNullableUnion<T extends ValidatorBase[]> extends UnionValidator<T, null | undefined> {
  public constructor(schema: T, options?: UnionValidatorOptions) {
    super(schema, { ...options, required: false, nullable: true })
  }
}

export abstract class EnumValidator<T extends readonly string[], C = never> extends UnionValidator<
  ExactStringValidator<T[number]>[],
  C
> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(
      schema.map(v => new RequiredExactString(v)),
      options
    )
  }
}

export class RequiredEnum<T extends readonly string[]> extends EnumValidator<T> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options })
  }
}

export class OptionalEnum<T extends readonly string[]> extends EnumValidator<T, undefined> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}

export class NullableEnum<T extends readonly string[]> extends EnumValidator<T, null> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, nullable: true })
  }
}

export class OptionalNullableEnum<T extends readonly string[]> extends EnumValidator<T, null | undefined> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, required: false, nullable: true })
  }
}

export abstract class DateTimeOrDateValidator<O = never> extends UnionValidator<
  Array<RequiredDateTime | RequiredDate>,
  O
> {
  public constructor(options?: ValidatorOptions) {
    super([new RequiredDateTime(), new RequiredDate()], options)
  }

  public validate(value: unknown, context?: string, options?: ValidatorOptions): ValidationFailure[] {
    const errors = super.validate(value, context, options)
    if (errors.length === 2) {
      return [
        new NotDatetimeOrDateFail(
          `Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp`,
          value,
          context
        )
      ]
    }
    return errors
  }
}

export class RequiredDateTimeOrDate extends DateTimeOrDateValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options })
  }
}

export class OptionalDateTimeOrDate extends DateTimeOrDateValidator<undefined> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}

export class NullableDateTimeOrDate extends DateTimeOrDateValidator<null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, nullable: true })
  }
}

export class OptionalNullableDateTimeOrDate extends DateTimeOrDateValidator<null | undefined> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false, nullable: true })
  }
}

export abstract class FloatOrFloatStringValidator<O = never> extends UnionValidator<
  Array<RequiredFloat | RequiredFloatString>,
  number | string | O
> {
  private errStr: string

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super([new RequiredFloat(min, max), new RequiredFloatString(min, max)], options)
    if (min === Number.MIN_SAFE_INTEGER && max !== Number.MAX_SAFE_INTEGER) {
      this.errStr = `Must be a float or a string formatted float smaller than ${max}`
    } else if (min !== Number.MIN_SAFE_INTEGER && max === Number.MAX_SAFE_INTEGER) {
      this.errStr = `Must be a float or a string formatted float larger than ${min}`
    } else if (min !== Number.MIN_SAFE_INTEGER && max !== Number.MAX_SAFE_INTEGER) {
      this.errStr = `Must be a float or a string formatted float between ${min} and ${max}`
    } else {
      this.errStr = `Must be a float or a string formatted float`
    }
  }

  public validate(value: unknown, context?: string, options?: ValidatorOptions): ValidationFailure[] {
    const errors = super.validate(value, context, options)
    if (errors.length === 2) {
      return [new NotFloatOrFloatStringFail(`${this.errStr}`, value, context)]
    }
    return errors
  }
}

export class RequiredFloatOrFloatString extends FloatOrFloatStringValidator {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options })
  }
}

export class OptionalFloatOrFloatString extends FloatOrFloatStringValidator<undefined> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}

export class NullableFloatOrFloatString extends FloatOrFloatStringValidator<null> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, nullable: true })
  }
}

export class OptionalNullableFloatOrFloatString extends FloatOrFloatStringValidator<null | undefined> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false, nullable: true })
  }
}

export abstract class IntegerOrIntegerStringValidator<O = never> extends UnionValidator<
  Array<RequiredInteger | RequiredIntegerString>,
  number | string | O
> {
  private errStr: string

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super([new RequiredInteger(min, max), new RequiredIntegerString(min, max)], options)
    if (min === Number.MIN_SAFE_INTEGER && max !== Number.MAX_SAFE_INTEGER) {
      this.errStr = `Must be a integer or a string formatted integer smaller than ${max}`
    } else if (min !== Number.MIN_SAFE_INTEGER && max === Number.MAX_SAFE_INTEGER) {
      this.errStr = `Must be a integer or a string formatted integer larger than ${min}`
    } else if (min !== Number.MIN_SAFE_INTEGER && max !== Number.MAX_SAFE_INTEGER) {
      this.errStr = `Must be a integer or a string formatted integer between ${min} and ${max}`
    } else {
      this.errStr = `Must be a integer or a string formatted integer`
    }
  }

  public validate(value: unknown, context?: string, options?: ValidatorOptions): ValidationFailure[] {
    const errors = super.validate(value, context, options)
    if (errors.length === 2) {
      return [new NotIntegerOrIntegerStringFail(`${this.errStr}`, value, context)]
    }
    return errors
  }
}

export class RequiredIntegerOrIntegerString extends IntegerOrIntegerStringValidator {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: true })
  }
}

export class OptionalIntegerOrIntegerString extends IntegerOrIntegerStringValidator<undefined> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}

export class NullableIntegerOrIntegerString extends IntegerOrIntegerStringValidator<null> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, nullable: true })
  }
}

export class OptionalNullableIntegerOrIntegerString extends IntegerOrIntegerStringValidator<null | undefined> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false, nullable: true })
  }
}
