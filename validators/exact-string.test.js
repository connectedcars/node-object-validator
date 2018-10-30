const expect = require('unexpected')
const { ExactString } = require('./index')

describe('ExactString', function() {
  it('accepts empty value', function() {
    const validator = ExactString('MyString', false)
    expect(validator.validate('key', null), 'to be', undefined)
    expect(validator.validate('key', undefined), 'to be', undefined)
  })

  it('requires non-empty value', function() {
    const validator = ExactString('MyString')
    expect(validator.validate('key', null), 'to have message', 'Field `key` (ExactString) is required')
    expect(validator.validate('key', undefined), 'to have message', 'Field `key` (ExactString) is required')
  })

  it('requires value to be exact string', function() {
    const validator = ExactString('MyString')
    expect(validator.validate('key', 'MyString'), 'to be', undefined)
    expect(
      validator.validate('key', ''),
      'to have message',
      'Field `key` (ExactString) must strictly equal "MyString" (received "")'
    )
    expect(
      validator.validate('key', 'mystring'),
      'to have message',
      'Field `key` (ExactString) must strictly equal "MyString" (received "mystring")'
    )
    expect(
      validator.validate('key', 'MyString '),
      'to have message',
      'Field `key` (ExactString) must strictly equal "MyString" (received "MyString ")'
    )
    expect(
      validator.validate('key', ' MyString'),
      'to have message',
      'Field `key` (ExactString) must strictly equal "MyString" (received " MyString")'
    )
    expect(
      validator.validate('key', 'bogus'),
      'to have message',
      'Field `key` (ExactString) must strictly equal "MyString" (received "bogus")'
    )
  })

  it('requires value to be same type (boolean)', function() {
    const validator = ExactString('true')
    expect(
      validator.validate('key', true),
      'to have message',
      'Field `key` (ExactString) must strictly equal "true" (received "true")'
    )
  })

  it('requires value to be same type (integer)', function() {
    const validator = ExactString('0')
    expect(
      validator.validate('key', 0),
      'to have message',
      'Field `key` (ExactString) must strictly equal "0" (received "0")'
    )
  })
})
