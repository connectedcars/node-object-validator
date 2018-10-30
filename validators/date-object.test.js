const expect = require('unexpected')
const DateObject = require('./date-object')

describe('DateObject', function() {
  it('accepts empty value', function() {
    const validator = DateObject(false)
    expect(validator.validate('key', null), 'to be', undefined)
    expect(validator.validate('key', undefined), 'to be', undefined)
  })

  it('requires non-empty value', function() {
    const validator = DateObject()
    expect(validator.validate('key', null), 'to have message', 'Field `key` (DateObject) is required')
    expect(validator.validate('key', undefined), 'to have message', 'Field `key` (DateObject) is required')
  })

  it('requires value to be a Date object', function() {
    const validator = DateObject()
    expect(validator.validate('key', new Date('2018-08-06T13:37:00Z')), 'to be', undefined)
    expect(validator.validate('key', new Date('2018-08-06')), 'to be', undefined)
    expect(validator.validate('key', new Date('13:37:00')), 'to be', undefined)
    expect(validator.validate('key', 500), 'to have message', 'Field `key` (DateObject) must be a Date object')
    expect(validator.validate('key', ''), 'to have message', 'Field `key` (DateObject) must be a Date object')
    expect(validator.validate('key', true), 'to have message', 'Field `key` (DateObject) must be a Date object')
    expect(validator.validate('key', false), 'to have message', 'Field `key` (DateObject) must be a Date object')
    expect(
      validator.validate('key', '2018-08-06T13:37:00Z'),
      'to have message',
      'Field `key` (DateObject) must be a Date object'
    )
  })
})
