const expect = require('unexpected')
const { DateTime } = require('./index')

describe('DateTime', function() {
  it('accepts empty value', function() {
    const validator = DateTime(false)
    expect(validator.validate('key', null), 'to be', undefined)
    expect(validator.validate('key', undefined), 'to be', undefined)
  })

  it('requires non-empty value', function() {
    const validator = DateTime()
    expect(validator.validate('key', null), 'to have message', 'Field `key` (DateTime) is required')
    expect(validator.validate('key', undefined), 'to have message', 'Field `key` (DateTime) is required')
  })

  it('requires value to be an RFC 3339 timestamp', function() {
    const validator = DateTime()
    expect(validator.validate('key', '2018-08-06T13:37:00Z'), 'to be', undefined)
    expect(validator.validate('key', '2018-08-06T13:37:00.000Z'), 'to be', undefined)
    expect(validator.validate('key', '2018-08-06T13:37:00+00:00'), 'to be', undefined)
    expect(validator.validate('key', '2018-08-06T13:37:00.000+00:00'), 'to be', undefined)
    expect(
      validator.validate('key', ''),
      'to have message',
      'Field `key` (DateTime) must be formatted as an RFC 3339 timestamp (received "")'
    )
    expect(
      validator.validate('key', '2018-08-06'),
      'to have message',
      'Field `key` (DateTime) must be formatted as an RFC 3339 timestamp (received "2018-08-06")'
    )
    expect(
      validator.validate('key', '2018-08-06T13:37:00'),
      'to have message',
      'Field `key` (DateTime) must be formatted as an RFC 3339 timestamp (received "2018-08-06T13:37:00")'
    )
    expect(
      validator.validate('key', '13:37:00'),
      'to have message',
      'Field `key` (DateTime) must be formatted as an RFC 3339 timestamp (received "13:37:00")'
    )
  })
})
