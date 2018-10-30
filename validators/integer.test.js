const expect = require('unexpected')
const { Integer } = require('./index')

describe('Integer', function() {
  it('accepts empty value', function() {
    const validator = Integer(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, false)
    expect(validator.validate('key', null), 'to be', undefined)
    expect(validator.validate('key', undefined), 'to be', undefined)
  })

  it('requires non-empty value', function() {
    const validator = Integer()
    expect(validator.validate('key', null), 'to have message', 'Field `key` (Integer) is required')
    expect(validator.validate('key', undefined), 'to have message', 'Field `key` (Integer) is required')
  })

  it('requires value to be an integer', function() {
    const validator = Integer()
    expect(validator.validate('key', 0), 'to be', undefined)
    expect(validator.validate('key', 1), 'to be', undefined)
    expect(validator.validate('key', 123), 'to be', undefined)
    expect(validator.validate('key', '1'), 'to have message', 'Field `key` (Integer) must be an integer (received "1")')
    expect(validator.validate('key', ''), 'to have message', 'Field `key` (Integer) must be an integer (received "")')
    expect(
      validator.validate('key', {}),
      'to have message',
      'Field `key` (Integer) must be an integer (received "[object Object]")'
    )
    expect(validator.validate('key', []), 'to have message', 'Field `key` (Integer) must be an integer (received "")')
    expect(
      validator.validate('key', true),
      'to have message',
      'Field `key` (Integer) must be an integer (received "true")'
    )
    expect(
      validator.validate('key', false),
      'to have message',
      'Field `key` (Integer) must be an integer (received "false")'
    )
  })

  it('requires min value', function() {
    const validator = Integer(5, 500)
    expect(
      validator.validate('key', -1),
      'to have message',
      'Field `key` (Integer) must be between 5 and 500 (received "-1")'
    )
    expect(
      validator.validate('key', 0),
      'to have message',
      'Field `key` (Integer) must be between 5 and 500 (received "0")'
    )
    expect(
      validator.validate('key', 1),
      'to have message',
      'Field `key` (Integer) must be between 5 and 500 (received "1")'
    )
    expect(
      validator.validate('key', 2),
      'to have message',
      'Field `key` (Integer) must be between 5 and 500 (received "2")'
    )
    expect(
      validator.validate('key', 3),
      'to have message',
      'Field `key` (Integer) must be between 5 and 500 (received "3")'
    )
    expect(
      validator.validate('key', 4),
      'to have message',
      'Field `key` (Integer) must be between 5 and 500 (received "4")'
    )
    expect(validator.validate('key', 5), 'to be', undefined)
    expect(validator.validate('key', 6), 'to be', undefined)
    expect(validator.validate('key', 123), 'to be', undefined)
  })

  it('requires max value', function() {
    const validator = Integer(-500, 5)
    expect(validator.validate('key', -1), 'to be', undefined)
    expect(validator.validate('key', 0), 'to be', undefined)
    expect(validator.validate('key', 1), 'to be', undefined)
    expect(validator.validate('key', 2), 'to be', undefined)
    expect(validator.validate('key', 3), 'to be', undefined)
    expect(validator.validate('key', 4), 'to be', undefined)
    expect(validator.validate('key', 5), 'to be', undefined)
    expect(
      validator.validate('key', 6),
      'to have message',
      'Field `key` (Integer) must be between -500 and 5 (received "6")'
    )
    expect(
      validator.validate('key', 7),
      'to have message',
      'Field `key` (Integer) must be between -500 and 5 (received "7")'
    )
  })
})
