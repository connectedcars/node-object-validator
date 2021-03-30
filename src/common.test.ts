import { ValidatorBase, ValidatorExportOptions, ValidatorOptions } from './common'
import { RequiredFail, ValidationErrorContext, ValidationFailure } from './errors'

class OneValidator extends ValidatorBase<number> {
  public constructor(options?: ValidatorOptions) {
    super(options)
    if (options?.optimize) {
      this.optimize()
    }
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return '1'
    }
    return `new ${this.constructor.name}(${this.optionsString})`
  }

  protected validateValue(value: unknown, context?: ValidationErrorContext | undefined): ValidationFailure[] {
    if (value !== 1) {
      return [new ValidationFailure(`value is not 1`, context)]
    }
    return []
  }
}

describe.each([false, true])('Common (optimize: %s)', optimize => {
  describe('ValidatorBase', () => {
    it(`should validate with the default codeGen implementation with optimize ${optimize}`, () => {
      const validator = new OneValidator({ optimize: optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(2)).toStrictEqual([new ValidationFailure(`value is not 1`)])
      expect(validator.validate(null)).toStrictEqual([new RequiredFail(`Is required`)])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail(`Is required`)])
    })
  })
})
