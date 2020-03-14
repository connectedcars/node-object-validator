import { OptionalDateTime } from './optional-datetime'

describe('OptionalDateTime', () => {
  it('requires empty value', function() {
    const validator = new OptionalDateTime()
    expect(validator.validate((undefined as unknown) as string)).toStrictEqual(null)
    expect(validator.validate((undefined as unknown) as string)).toStrictEqual(null)
  })
})
