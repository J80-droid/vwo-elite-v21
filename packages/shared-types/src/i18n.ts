/**
 * Type definition for the translation function (t) used in VWO Elite.
 * Supports both function calls and property access via Proxy.
 */
export interface TFunction {
  (
    key: string,
    defaultValue?: string | Record<string, unknown>,
    options?: Record<string, unknown>,
  ): string;
  [key: string]: unknown;
}
