const { ValidationError } = require('../lib/errors')

const pattern = /^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([\+|\-]([01][0-9]|2[0-3]):[0-5][0-9]))$/

class DateTime {
  constructor(required = true) {
    this.type = 'DateTime'
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
    if (!pattern.test(val)) {
      return new ValidationError(
        `Field \`${key}\` (${this.type}) must be formatted as an RFC 3339 timestamp (received "${val}")`,
        { key, val }
      )
    }
  }
}

module.exports = { DateTime }
