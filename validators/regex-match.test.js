const expect = require('unexpected')
const { RegexMatch } = require('./index')

describe('RegexMatch', function() {
  it('accepts empty value', function() {
    const validator = RegexMatch(/^.*$/, false)
    expect(validator.validate('key', null), 'to be', undefined)
    expect(validator.validate('key', undefined), 'to be', undefined)
  })

  it('requires non-empty value', function() {
    const validator = RegexMatch(/^.*$/)
    expect(validator.validate('key', null), 'to have message', 'Field `key` (RegexMatch) is required')
    expect(validator.validate('key', undefined), 'to have message', 'Field `key` (RegexMatch) is required')
  })

  it('requires value to be a string', function() {
    const validator = RegexMatch(/^.*$/)
    expect(validator.validate('key', 'foo'), 'to be', undefined)
    expect(validator.validate('key', ''), 'to be', undefined)
    expect(validator.validate('key', 1), 'to have message', 'Field `key` (RegexMatch) must be a string (received "1")')
    expect(
      validator.validate('key', {}),
      'to have message',
      'Field `key` (RegexMatch) must be a string (received "[object Object]")'
    )
    expect(validator.validate('key', []), 'to have message', 'Field `key` (RegexMatch) must be a string (received "")')
    expect(
      validator.validate('key', true),
      'to have message',
      'Field `key` (RegexMatch) must be a string (received "true")'
    )
    expect(
      validator.validate('key', false),
      'to have message',
      'Field `key` (RegexMatch) must be a string (received "false")'
    )
  })

  it('requires match', function() {
    const validator = RegexMatch(/^abcde/)
    expect(
      validator.validate('key', ''),
      'to have message',
      `Field \`key\` (RegexMatch) did not match '/^abcde/' (received "")`
    )
    expect(
      validator.validate('key', 'abcd'),
      'to have message',
      `Field \`key\` (RegexMatch) did not match '/^abcde/' (received "abcd")`
    )
    expect(validator.validate('key', 'abcde'), 'to be', undefined)
    expect(validator.validate('key', 'abcdef'), 'to be', undefined)
  })
})
