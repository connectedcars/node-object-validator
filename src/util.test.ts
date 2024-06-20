import { generateRustTypes, toSnakeCase } from './util'

describe('toSnakeCase', () => {
  it('lower case first', () => {
    const res = toSnakeCase('katteKilling')
    expect(res).toEqual('katte_killing')
  })

  it('upper case first', () => {
    const res = toSnakeCase('KatteKilling')
    expect(res).toEqual('katte_killing')
  })
})

describe('generateRustTypes', () => {
  it('write to file', () => {
    // TODO: have dump and compare
    generateRustTypes([])
  })
})
