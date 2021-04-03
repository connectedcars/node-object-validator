export class ValidationFailure {
  public context?: string
  public value: unknown
  public get message(): string {
    return (
      (this.context
        ? `Field '${this.context}' ${this._message.charAt(0).toLowerCase() + this._message.slice(1)}`
        : this._message) + (this.value === undefined ? '' : ` (received "${this.value}")`)
    )
  }
  private _message: string

  public constructor(message: string, value: unknown, context?: string) {
    this._message = message
    this.value = value
    this.context = context
  }

  public toString(): string {
    return `${this.constructor.name}: ${this.message}`
  }
}

export class ValidationsError extends Error {
  public errors: ValidationFailure[]
  public constructor(message: string, errors: ValidationFailure[]) {
    super(message)
    this.errors = errors
    this.name = this.constructor.name
  }
}

export class DoesNotMatchRegexFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotArrayFail extends ValidationFailure {}
export class NotDateFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotDatetimeOrDateFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotExactStringFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotFloatFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotFloatOrFloatStringFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotFloatStringFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotIntegerFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotIntegerOrIntegerStringFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotIntegerStringFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotObjectFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotRfc3339Fail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotStringFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class OutOfRangeFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class RequiredFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class WrongLengthFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class UnionFail extends ValidationFailure {
  public errors: ValidationFailure[]
  public constructor(message: string, errors: ValidationFailure[], context?: string) {
    super(message, undefined, context)
    this.errors = errors
  }
}
export class NotBooleanFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
export class NotNullFail extends ValidationFailure {
  public constructor(message: string, context?: string) {
    super(message, undefined, context)
  }
}
