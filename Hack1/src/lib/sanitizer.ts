/**
 * Shared Text Sanitizer
 * Strictly enforces NO em dashes anywhere in the interface, AI output, or communications.
 * Transforms em dashes (U+2014), en dashes used as dashes (U+2013), &mdash;, and double hyphens
 * into appropriate natural punctuation (commas, colons, or parentheses).
 */

export function sanitizeNoEmDash(input: string | null | undefined): string {
  if (!input) return "";

  let result = input;

  // Replace HTML entity &mdash; and &ndash;
  result = result.replace(/&mdash;/gi, ", ");
  result = result.replace(/&ndash;/gi, ", ");

  // Replace Unicode em dash (U+2014)
  result = result.replace(/\u2014/g, ", ");

  // Replace Unicode en dash (U+2013) when surrounded by spaces
  result = result.replace(/\s+\u2013\s+/g, ", ");

  // Replace spaced or unspaced double/triple hyphens used as dashes (e.g. " -- " or "--")
  result = result.replace(/\s*--+\s*/g, ", ");

  // Clean up duplicate commas or awkward comma spacing
  result = result.replace(/,\s*,+/g, ", ");
  result = result.replace(/\s+,\s*/g, ", ");
  result = result.replace(/^,\s*/, ""); // remove leading comma if produced

  return result.trim();
}

export const sanitizeText = sanitizeNoEmDash;

/**
 * Deeply sanitizes any string fields within an object or array.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") {
    return sanitizeNoEmDash(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }
  if (typeof obj === "object") {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitizedObj[key] = sanitizeObject(value);
    }
    return sanitizedObj as T;
  }
  return obj;
}
