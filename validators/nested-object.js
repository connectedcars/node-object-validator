const { ValidationError } = require('../lib/errors')

class NestedObject {
  constructor(required = true) {
    this.type = 'NestedObject'
    this.children = {}
    this._required = required
  }

  validate(key, val) {
    if (val == null) {
      if (this._required) {
        return new ValidationError(`Field \`${key}\` (${this.type}) is required`, { key, val })
      } else {
        return
      }
    }
  }
}

module.exports = { NestedObject }
