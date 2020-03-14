import { RequiredError } from '../../errors'
import { RequiredString } from './required-string'

describe('RequiredStringValue', () => {
  it('requires empty value', function() {
    const validator = new RequiredString(0, Number.MAX_SAFE_INTEGER)
    expect(validator.validate((null as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
    expect(validator.validate((undefined as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
  })
})
