import { OptionalString } from './optional-string'

describe('OptionalString', () => {
  it('requires empty value', function() {
    const validator = new OptionalString()
    expect(validator.validate((undefined as unknown) as string)).toStrictEqual(null)
    expect(validator.validate((undefined as unknown) as string)).toStrictEqual(null)
  })
})
