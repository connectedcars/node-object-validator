import { ObjectValidator } from './object-validator'
import { OptionalArray, RequiredArray } from './validators/array'
import { OptionalInteger, RequiredInteger } from './validators/integer'
import { RequiredObject } from './validators/object'

// https://github.com/pirix-gh/ts-toolbelt/tree/master/src/List

describe('ObjectValidator', () => {
  const objectValidator = new ObjectValidator({
    int: new RequiredInteger(1, 2),
    optionalInt: new OptionalInteger(1, 2),
    requiredObject: new RequiredObject({
      int: new RequiredInteger(1, 2),
      optionalInt: new OptionalInteger(1, 2)
    }),
    optionalArray: new OptionalArray(new RequiredInteger(1, 2)),
    optionalArrayArray: new OptionalArray(new RequiredArray(new RequiredInteger(1, 2)))
  })

  describe('isValid', () => {
    it('validates correct value', () => {
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]]
      }
      expect(objectValidator.validate(unknownValue)).toEqual([])
    })

    it('rejects wrong types', () => {
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: ['1'],
        optionalArrayArray: [1]
      }
      expect(objectValidator.validate(unknownValue)).toEqual([
        new Error(`Field 'optionalArray[0]' must be an integer (received "1")`),
        new Error(`Field 'optionalArrayArray[0]' must be an array (received "1")`)
      ])
    })
  })
})
