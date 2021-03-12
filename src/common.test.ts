import { ValidatorBase, ValidatorOptions } from './common'
import { ValidationErrorContext, ValidationFailure } from './errors'

class OneValidator extends ValidatorBase<number> {
  public constructor(options?: ValidatorOptions) {
    super(options)
    if (options?.optimize) {
      this.optimize()
    }
  }
  protected validateValue(value: unknown, context?: ValidationErrorContext | undefined): ValidationFailure[] {
    if (value !== 1) {
      return [new ValidationFailure(`value is not 1`, context)]
    }
    return []
  }
}

describe('Common', () => {
  describe('ValidatorBase', () => {
    describe('codeGen', () => {
      it(`should validate with the default codeGen implementation with optimize false`, () => {
        const validator = new OneValidator({ optimize: false })
        expect(validator.validate(1)).toStrictEqual([])
      })

      it(`should validate with the default codeGen implementation with optimize true`, () => {
        const validator = new OneValidator({ optimize: true })
        expect(validator.validate(1)).toStrictEqual([])
      })
    })
  })
})
