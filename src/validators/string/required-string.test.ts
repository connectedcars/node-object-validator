import { RequiredError } from '../../errors'
import { RequiredString } from './required-string'

describe('RequiredString', () => {
  it('requires empty value', function() {
    const validator = new RequiredString()
    expect(validator.validate((null as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
    expect(validator.validate((undefined as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
  })
})
