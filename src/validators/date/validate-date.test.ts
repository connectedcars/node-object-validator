import { NotDateError } from '../../errors'
import { validateDate } from './validate-date'

describe('validateDate', () => {
  it('requires value to be a Date object', () => {
    expect(validateDate(new Date('2018-08-06T13:37:00Z'))).toStrictEqual(null)
    expect(validateDate(new Date('2018-08-06'))).toStrictEqual(null)
    expect(validateDate(new Date('13:37:00'))).toStrictEqual(null)
    expect(validateDate((500 as unknown) as Date)).toStrictEqual(new NotDateError('Must be a Date object'))
    expect(validateDate(('' as unknown) as Date)).toStrictEqual(new NotDateError('Must be a Date object'))
    expect(validateDate((true as unknown) as Date)).toStrictEqual(new NotDateError('Must be a Date object'))
    expect(validateDate((false as unknown) as Date)).toStrictEqual(new NotDateError('Must be a Date object'))
    expect(validateDate(('2018-08-06T13:37:00Z' as unknown) as Date)).toStrictEqual(
      new NotDateError('Must be a Date object')
    )
  })
})
