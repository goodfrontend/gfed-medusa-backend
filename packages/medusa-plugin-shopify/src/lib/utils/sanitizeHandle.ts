/**
 * Sanitizes Shopify handles to make them URL-safe for Medusa
 *
 * This function converts Shopify product/collection handles into URL-safe formats
 * that comply with Medusa's validation rules. It handles various edge cases:
 * - Converts underscores and other special characters to hyphens
 * - Removes multiple consecutive hyphens
 * - Trims leading and trailing hyphens
 * - Limits length to 255 characters
 * - Converts to lowercase for consistency
 *
 * @param handle - The original Shopify handle (e.g., "womens-shirt_agave-green")
 * @returns A sanitized, URL-safe handle (e.g., "womens-shirt-agave-green")
 *
 * @example
 * ```typescript
 * sanitizeHandle("Women's Shirt[@Green](https://github.com/Green)") // returns "womens-shirt-green"
 * sanitizeHandle("product---with---dashes") // returns "product-with-dashes"
 * sanitizeHandle("_leading-trailing_") // returns "leading-trailing"
 * ```
 */
export function sanitizeHandle(handle: string): string {
  if (!handle) return '';

  return handle
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading and trailing hyphens
    .substring(0, 255); // Limit length to 255 characters
}
