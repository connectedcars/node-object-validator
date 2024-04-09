import { RequiredArray } from './array'
import { OptionalInteger, RequiredInteger } from './integer'

describe('Types export', () => {
  describe('TypeScript', () => {
    it('should export TypeScript types for array of integer', () => {
      const validator = new RequiredArray(new RequiredInteger(), 0, 10)
      const tsTypes = validator.toString({ types: true })
      expect(tsTypes).toEqual(`Array<number>`)
    })

    it('should export TypeScript types for array of optional integer', () => {
      const validator = new RequiredArray(new OptionalInteger(), 0, 10)
      const tsTypes = validator.toString({ types: true })
      expect(tsTypes).toEqual(`Array<number | undefined>`)
    })
  })

  describe('Rust', () => {
    it('should export Rust Vec<i64> type for array of integer', () => {
      const validator = new RequiredArray(new RequiredInteger(), 0, 10)
      const tsTypes = validator.toString({ types: true, language: 'rust' })
      expect(tsTypes).toEqual(`Vec<i64>`)
    })

    it('should export Rust types Vec<Option<i64>> for array of optional integer', () => {
      const validator = new RequiredArray(new OptionalInteger(), 0, 10)
      const tsTypes = validator.toString({ types: true, language: 'rust' })
      expect(tsTypes).toEqual(`Vec<Option<i64>>`)
    })
  })
})
