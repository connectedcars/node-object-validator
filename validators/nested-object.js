const { ValidationError } = require('../lib/errors')

function NestedObject(required = true) {
  return {
    type: 'NestedObject',
    children: {},
    validate: function(key, val) {
      if (val == null) {
        if (required) {
          return new ValidationError(`Field \`${key}\` (${this.type}) is required`)
        } else {
          return
        }
      }
    }
  }
}

module.exports = NestedObject
