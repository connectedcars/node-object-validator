import { OptionalDate } from './optional-date'

describe('OptionalStringValue', () => {
  it('accepts empty value', function() {
    const validator = new OptionalDate()
    expect(validator.validate((null as unknown) as Date)).toStrictEqual(null)
    expect(validator.validate((undefined as unknown) as Date)).toStrictEqual(null)
  })
})
