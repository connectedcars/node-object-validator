import {
  ExactStringValidator,
  isPlainObject,
  ObjectValidator,
  RequiredDate,
  RequiredDateTime,
  RequiredExactString,
  RequiredFloat,
  RequiredFloatString,
  RequiredInteger,
  RequiredIntegerString
} from '..'
import {
  CodeGenResult,
  ValidateOptions,
  ValidatorBase,
  ValidatorBaseOptions,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
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

export interface ValidateUnionOptions extends ValidateOptions {
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
    const currentErrors = validator.validate(value, propName, { optimized: false, earlyFail: false, ...options })
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

  private rustTypeGenerated: boolean
  private rustTypeName?: string

  public constructor(schema: T, options?: UnionValidatorOptions & ValidatorBaseOptions) {
    super(options)
    this.schema = schema
    this.rustTypeGenerated = false
    this.rustTypeName = options?.rustTypeName
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

    // Try to find an common key for the union to skip checking all entries
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

  protected validateValue(value: unknown, context?: string, options?: ValidateOptions): ValidationFailure[] {
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
        // TODO: we assume every element is an "ExactString". Which toStrings() to just a name
        if (this.rustTypeName === undefined) {
          throw new Error(`'rustTypeName' option is not set`)
        }

        if (!this.rustTypeGenerated) {
          this.rustTypeGenerated = true

          const lines = this.schema.map(validatorElement => {
            const str = validatorElement.toString({ types: false })
            if (str.includes(`ExactString`) === false) {
              throw new Error(`Unions/Enums in Rust require 'ExactString' as values`)
            }

            return validatorElement.toString(options)
          })

          return `enum ${this.rustTypeName} {\n  ${lines.join('\n')},\n}`
        }
        const isOption = !this.required || this.nullable
        return isOption ? `Option<${this.rustTypeName}>` : `${this.rustTypeName}`
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
  public constructor(schema: T, options?: ValidatorBaseOptions) {
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
  public constructor(options?: ValidatorBaseOptions) {
    super([new RequiredDateTime(), new RequiredDate()], options)
  }

  public validate(value: unknown, context?: string, options?: ValidateOptions): ValidationFailure[] {
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

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorBaseOptions) {
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

  public validate(value: unknown, context?: string, options?: ValidateOptions): ValidationFailure[] {
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

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER, options?: ValidatorBaseOptions) {
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

  public validate(value: unknown, context?: string, options?: ValidateOptions): ValidationFailure[] {
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
