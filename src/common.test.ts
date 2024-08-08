import { ValidatorBase, ValidatorExportOptions, ValidatorOptions } from './common'
import { RequiredFail, ValidationFailure } from './errors'

abstract class OneValidator<C = never> extends ValidatorBase<number | C> {
  public constructor(options?: ValidatorOptions) {
    super(options)
    if (options?.optimize !== false) {
      this.optimize()
    }
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return '1'
    }
    return `new ${this.constructor.name}(${this.optionsString})`
  }

  protected validateValue(value: unknown, context?: string | undefined): ValidationFailure[] {
    if (value !== 1) {
      return [new ValidationFailure(`value is not 1`, value, context)]
    }
    return []
  }
}

class RequiredOne extends OneValidator {
  public constructor(options: ValidatorOptions) {
    super({ ...options })
  }
}

class OptionalOne extends OneValidator<undefined> {
  public constructor(options: ValidatorOptions) {
    super({ ...options, required: false })
  }
}

class NullableOne extends OneValidator<null> {
  public constructor(options: ValidatorOptions) {
    super({ ...options, nullable: true })
  }
}

describe.each([false, true])('Common (optimize: %s)', optimize => {
  describe('ValidatorBase', () => {
    it(`should validate required with the default codeGen implementation with optimize ${optimize}`, () => {
      const validator = new RequiredOne({ optimize: optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(2)).toStrictEqual([new ValidationFailure(`value is not 1`, 2)])
      expect(validator.validate(null)).toStrictEqual([new ValidationFailure(`value is not 1`, null)])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail(`Is required`, undefined)])
      validator.AssertType<number, true>()
    })

    it(`should validate optional with the default codeGen implementation with optimize ${optimize}`, () => {
      const validator = new OptionalOne({ optimize: optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(2)).toStrictEqual([new ValidationFailure(`value is not 1`, 2)])
      expect(validator.validate(null)).toStrictEqual([new ValidationFailure(`value is not 1`, null)])
      validator.AssertType<number | undefined, true>()
      validator.AssertType<number, false>()
    })

    it(`should validate optional with the default codeGen implementation with optimize ${optimize}`, () => {
      const validator = new NullableOne({ optimize: optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(2)).toStrictEqual([new ValidationFailure(`value is not 1`, 2)])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail(`Is required`, undefined)])
      validator.AssertType<number | null, true>()
      validator.AssertType<number, false>()
    })
  })
})
