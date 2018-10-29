const expect = require('unexpected')
const Float = require('./float')

describe('Float', function() {
  it('accepts empty value', function() {
    const validator = Float(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, false)
    expect(validator.validate('key', null), 'to be', undefined)
    expect(validator.validate('key', undefined), 'to be', undefined)
  })

  it('requires non-empty value', function() {
    const validator = Float()
    expect(validator.validate('key', null), 'to have message', 'Field `key` (Float) is required')
    expect(validator.validate('key', undefined), 'to have message', 'Field `key` (Float) is required')
  })

  it('requires value to be a float', function() {
    const validator = Float()
    expect(validator.validate('key', 0.0001), 'to be', undefined)
    expect(validator.validate('key', 1), 'to be', undefined)
    expect(validator.validate('key', 1.25), 'to be', undefined)
    expect(validator.validate('key', 123), 'to be', undefined)
    expect(validator.validate('key', '1'), 'to have message', 'Field `key` (Float) must be a float (received "1")')
    expect(validator.validate('key', ''), 'to have message', 'Field `key` (Float) must be a float (received "")')
    expect(
      validator.validate('key', {}),
      'to have message',
      'Field `key` (Float) must be a float (received "[object Object]")'
    )
    expect(validator.validate('key', []), 'to have message', 'Field `key` (Float) must be a float (received "")')
    expect(validator.validate('key', true), 'to have message', 'Field `key` (Float) must be a float (received "true")')
    expect(
      validator.validate('key', false),
      'to have message',
      'Field `key` (Float) must be a float (received "false")'
    )
  })

  it('requires min value', function() {
    const validator = Float(0.5, 500)
    expect(
      validator.validate('key', -0.1),
      'to have message',
      'Field `key` (Float) must be between 0.5 and 500 (received "-0.1")'
    )
    expect(
      validator.validate('key', 0),
      'to have message',
      'Field `key` (Float) must be between 0.5 and 500 (received "0")'
    )
    expect(
      validator.validate('key', 0.1),
      'to have message',
      'Field `key` (Float) must be between 0.5 and 500 (received "0.1")'
    )
    expect(
      validator.validate('key', 0.2),
      'to have message',
      'Field `key` (Float) must be between 0.5 and 500 (received "0.2")'
    )
    expect(
      validator.validate('key', 0.3),
      'to have message',
      'Field `key` (Float) must be between 0.5 and 500 (received "0.3")'
    )
    expect(
      validator.validate('key', 0.4),
      'to have message',
      'Field `key` (Float) must be between 0.5 and 500 (received "0.4")'
    )
    expect(
      validator.validate('key', 0.49999999),
      'to have message',
      'Field `key` (Float) must be between 0.5 and 500 (received "0.49999999")'
    )
    expect(validator.validate('key', 0.5), 'to be', undefined)
    expect(validator.validate('key', 0.6), 'to be', undefined)
    expect(validator.validate('key', 123.456), 'to be', undefined)
  })

  it('requires max value', function() {
    const validator = Float(-500, 0.5)
    expect(validator.validate('key', -0.1), 'to be', undefined)
    expect(validator.validate('key', 0), 'to be', undefined)
    expect(validator.validate('key', 0.1), 'to be', undefined)
    expect(validator.validate('key', 0.2), 'to be', undefined)
    expect(validator.validate('key', 0.3), 'to be', undefined)
    expect(validator.validate('key', 0.4), 'to be', undefined)
    expect(validator.validate('key', 0.5), 'to be', undefined)
    expect(
      validator.validate('key', 0.500000001),
      'to have message',
      'Field `key` (Float) must be between -500 and 0.5 (received "0.500000001")'
    )
    expect(
      validator.validate('key', 0.6),
      'to have message',
      'Field `key` (Float) must be between -500 and 0.5 (received "0.6")'
    )
    expect(
      validator.validate('key', 0.7),
      'to have message',
      'Field `key` (Float) must be between -500 and 0.5 (received "0.7")'
    )
  })
})
