let { DateObject } = require('./date-object')
let { DateTime } = require('./date-time')
let { ExactString } = require('./exact-string')
let { Float } = require('./float')
let { Integer } = require('./integer')
let { NestedArray } = require('./nested-array')
let { NestedObject } = require('./nested-object')
let { StringValue } = require('./string-value')
let { RegexMatch } = require('./regex-match')

module.exports = {
  DateObject: required => new DateObject(required),
  DateTime: required => new DateTime(required),
  ExactString: (expectedStr, required) => new ExactString(expectedStr, required),
  Float: (min, max, required) => new Float(min, max, required),
  Integer: (min, max, required) => new Integer(min, max, required),
  NestedArray: (minLength, maxLength, required) => new NestedArray(minLength, maxLength, required),
  NestedObject: required => new NestedObject(required),
  StringValue: (minLength, maxLength, required) => new StringValue(minLength, maxLength, required),
  RegexMatch: (regex, required) => new RegexMatch(regex, required)
}
