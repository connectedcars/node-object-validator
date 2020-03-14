import { RequiredError } from '../../errors'
import { RequiredDateTime } from './required-datetime'

describe('RequiredStringValue', () => {
  it('requires empty value', function() {
    const validator = new RequiredDateTime()
    expect(validator.validate((null as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
    expect(validator.validate((undefined as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
  })
})
