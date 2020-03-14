export type ObjectValidatorOptions = {
  /**
   * Generate an optimized function for doing the validation (default: true)
   */
  optimize?: boolean
  /**
   * Write the optimized function to a file and reuse this if it exists, no cache invalidation is done (Not recommended)
   */
  cacheFile?: boolean
}

/**
 * @typedef ObjectValidatorOptions
 * @property {boolean} [optimize=true] Generate an optimized function for doing the validation (default: true)
 * @property {boolean} [cacheFile] Write the optimized function to a file and reuse this if it exists, no cache invalidation is done (Not recommended)
 */
export class ObjectValidator<T> {
  private schema: Record<string, any>
  public constructor(schema: Record<string, any>, options?: ObjectValidatorOptions) {
    this.schema = schema
  }

  public validate(obj: unknown): Error[] {
    return []
  }

  // Patch object validator with validate function
  public isValid(obj: Record<string, any>): obj is T {
    return true
  }
}
