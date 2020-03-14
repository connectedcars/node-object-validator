import { OptionalExactString } from './optional-exact-string'

describe('OptionalExactString', () => {
  it('requires empty value', function() {
    const validator = new OptionalExactString()
    expect(validator.validate((undefined as unknown) as string, 'MyString')).toStrictEqual(null)
    expect(validator.validate((undefined as unknown) as string, 'MyString')).toStrictEqual(null)
  })
})
