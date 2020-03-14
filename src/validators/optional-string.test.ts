import { OptionalString } from './optional-string'

describe('OptionalStringValue', () => {
  it('requires empty value', function() {
    const validator = new OptionalString(0, Number.MAX_SAFE_INTEGER)
    expect(validator.validate((undefined as unknown) as string)).toStrictEqual(null)
    expect(validator.validate((undefined as unknown) as string)).toStrictEqual(null)
  })
})
