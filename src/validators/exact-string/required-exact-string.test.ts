import { RequiredError } from '../../errors'
import { RequiredExactString } from './required-exact-string'

describe('RequiredExactString', () => {
  it('requires empty value', function() {
    const validator = new RequiredExactString()
    expect(validator.validate((null as unknown) as string, 'MyString')).toStrictEqual(new RequiredError('Is required'))
    expect(validator.validate((undefined as unknown) as string, 'MyString')).toStrictEqual(
      new RequiredError('Is required')
    )
  })
})
