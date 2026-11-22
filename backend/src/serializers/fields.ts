/**
 * Defensive field helpers shared by the API response serializers.
 *
 * API responses are built from values that come from outside this process
 * (Soroban `scValToNative` output, TypeORM rows). Those values can carry
 * extra keys, `bigint` amounts, or snake_case names. Serializers map only the
 * fields named in their contract model, so these helpers read a value
 * tolerantly while the serializer decides exactly what is emitted.
 */

export type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord {
  return value !== null && typeof value === "object" ? (value as UnknownRecord) : {};
}

/**
 * Reads the first present alias for a string field, coercing numbers and
 * bigints (contract amounts arrive as bigints). Never returns `undefined`, so
 * the serialized shape is identical for every record.
 */
export function pickString(
  record: UnknownRecord,
  keys: readonly string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
    if (typeof value === "bigint" || typeof value === "number") return String(value);
  }
  return fallback;
}

export function pickNumber(
  record: UnknownRecord,
  keys: readonly string[],
  fallback = 0,
): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "bigint") return Number(value);
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

export function pickBoolean(
  record: UnknownRecord,
  keys: readonly string[],
  fallback = false,
): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

export function pickNullableString(
  record: UnknownRecord,
  keys: readonly string[],
): string | null {
  const value = pickString(record, keys);
  return value === "" ? null : value;
}

/** Reads a string field constrained to one of `allowed`, else `fallback`. */
export function pickEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}
