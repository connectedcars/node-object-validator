import { ObjectValidator } from './object-validator'
import { OptionalInteger, RequiredInteger } from './validators/integer'
import { RequiredObject } from './validators/object'

describe('ObjectValidator', () => {
  const objectValidator = new ObjectValidator({
    int: new RequiredInteger(1, 2),
    optionalInt: new OptionalInteger(1, 2),
    requiredObject: new RequiredObject({
      int: new RequiredInteger(1, 2),
      optionalInt: new OptionalInteger(1, 2)
    })
    //test: new Error()
  })

  describe('isValid', () => {
    it('validates correct value and cast to schema type', () => {
      const unknownValue: typeof objectValidator.type = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        }
      }
      if (objectValidator.isValid(unknownValue as unknown)) {
        expect(1).toEqual<number>(unknownValue.int)
        expect(1).toEqual<number | undefined>(unknownValue.optionalInt)
        expect(1).toEqual<number>(unknownValue.requiredObject.int)
      } else {
        throw new Error('Hello')
      }
    })
  })
})
