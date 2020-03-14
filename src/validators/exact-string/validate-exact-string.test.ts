import { NotExactStringError } from '../../errors'
import { validateExactString } from './validate-exact-string'

describe('validateExactString', () => {
  it('requires value to be exact string', function() {
    expect(validateExactString('MyString', 'MyString')).toStrictEqual(null)
    expect(validateExactString('', 'MyString')).toStrictEqual(
      new NotExactStringError('Must strictly equal "MyString" (received "")')
    )
    expect(validateExactString('mystring', 'MyString')).toStrictEqual(
      new NotExactStringError('Must strictly equal "MyString" (received "mystring")')
    )
    expect(validateExactString('MyString ', 'MyString')).toStrictEqual(
      new NotExactStringError('Must strictly equal "MyString" (received "MyString ")')
    )
    expect(validateExactString(' MyString', 'MyString')).toStrictEqual(
      new NotExactStringError('Must strictly equal "MyString" (received " MyString")')
    )
    expect(validateExactString('bogus', 'MyString')).toStrictEqual(
      new NotExactStringError('Must strictly equal "MyString" (received "bogus")')
    )
  })

  it('requires value to be same type (boolean)', () => {
    expect(validateExactString((true as unknown) as string, 'true')).toStrictEqual(
      new NotExactStringError('Must strictly equal "true" (received "true")')
    )
  })

  it('requires value to be same type (integer)', () => {
    expect(validateExactString((0 as unknown) as string, '0')).toStrictEqual(
      new NotExactStringError('Must strictly equal "0" (received "0")')
    )
  })
})
