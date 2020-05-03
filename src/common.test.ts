import { ValidatorBase, ValidatorOptions } from './common'
import { ValidationErrorContext, ValidationFailure } from './errors'

class OneValidator extends ValidatorBase<number> {
  public constructor(options?: ValidatorOptions) {
    super()
    if (options?.optimize) {
      this.validate = this.optimize()
    }
  }
  public validate(value: unknown, context?: ValidationErrorContext | undefined): ValidationFailure[] {
    if (value !== 1) {
      return [new ValidationFailure(`value is not 1`, context)]
    }
    return []
  }
}

describe.each([false, true])('Common (optimize: %s)', optimize => {
  describe('ValidatorBase', () => {
    describe('codeGen', () => {
      it(`should validate with the default codeGen implementation`, () => {
        const validator = new OneValidator({ optimize })
        expect(validator.validate(1)).toStrictEqual([])
      })
    })
  })
})
