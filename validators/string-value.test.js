const expect = require('unexpected')
const StringValue = require('./string-value')

describe('StringValue', function() {
  it('accepts empty value', function() {
    const validator = StringValue(0, Number.MAX_SAFE_INTEGER, false)
    expect(validator.validate('key', null), 'to be', undefined)
    expect(validator.validate('key', undefined), 'to be', undefined)
  })

  it('requires non-empty value', function() {
    const validator = StringValue()
    expect(validator.validate('key', null), 'to have message', 'Field `key` (StringValue) is required')
    expect(validator.validate('key', undefined), 'to have message', 'Field `key` (StringValue) is required')
  })

  it('requires value to be a string', function() {
    const validator = StringValue()
    expect(validator.validate('key', 'foo'), 'to be', undefined)
    expect(validator.validate('key', ''), 'to be', undefined)
    expect(validator.validate('key', 1), 'to have message', 'Field `key` (StringValue) must be a string (received "1")')
    expect(
      validator.validate('key', {}),
      'to have message',
      'Field `key` (StringValue) must be a string (received "[object Object]")'
    )
    expect(validator.validate('key', []), 'to have message', 'Field `key` (StringValue) must be a string (received "")')
    expect(
      validator.validate('key', true),
      'to have message',
      'Field `key` (StringValue) must be a string (received "true")'
    )
    expect(
      validator.validate('key', false),
      'to have message',
      'Field `key` (StringValue) must be a string (received "false")'
    )
  })

  it('requires min value length', function() {
    const validator = StringValue(5)
    expect(
      validator.validate('key', ''),
      'to have message',
      'Field `key` (StringValue) must at least contain 5 characters (received "")'
    )
    expect(
      validator.validate('key', 'a'),
      'to have message',
      'Field `key` (StringValue) must at least contain 5 characters (received "a")'
    )
    expect(
      validator.validate('key', 'ab'),
      'to have message',
      'Field `key` (StringValue) must at least contain 5 characters (received "ab")'
    )
    expect(
      validator.validate('key', 'abc'),
      'to have message',
      'Field `key` (StringValue) must at least contain 5 characters (received "abc")'
    )
    expect(
      validator.validate('key', 'abcd'),
      'to have message',
      'Field `key` (StringValue) must at least contain 5 characters (received "abcd")'
    )
    expect(validator.validate('key', 'abcde'), 'to be', undefined)
    expect(validator.validate('key', 'abcdef'), 'to be', undefined)
    expect(validator.validate('key', 'this is a long string'), 'to be', undefined)
  })

  it('requires max value length', function() {
    const validator = StringValue(0, 5)
    expect(validator.validate('key', ''), 'to be', undefined)
    expect(validator.validate('key', 'a'), 'to be', undefined)
    expect(validator.validate('key', 'ab'), 'to be', undefined)
    expect(validator.validate('key', 'abc'), 'to be', undefined)
    expect(validator.validate('key', 'abcd'), 'to be', undefined)
    expect(validator.validate('key', 'abcde'), 'to be', undefined)
    expect(
      validator.validate('key', 'abcdef'),
      'to have message',
      'Field `key` (StringValue) must at most contain 5 characters (received "abcdef")'
    )
    expect(
      validator.validate('key', 'abcdefg'),
      'to have message',
      'Field `key` (StringValue) must at most contain 5 characters (received "abcdefg")'
    )
    expect(
      validator.validate('key', 'this is a long string'),
      'to have message',
      'Field `key` (StringValue) must at most contain 5 characters (received "this is a long string")'
    )
  })
})
