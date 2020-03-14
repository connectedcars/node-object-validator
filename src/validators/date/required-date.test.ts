import { RequiredError } from '../../errors'
import { RequiredDate } from './required-date'

describe('OptionalStringValue', () => {
  it('accepts empty value', function() {
    const validator = new RequiredDate()
    expect(validator.validate((null as unknown) as Date)).toStrictEqual(new RequiredError('Is required'))
    expect(validator.validate((undefined as unknown) as Date)).toStrictEqual(new RequiredError('Is required'))
  })
})
