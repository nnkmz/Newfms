/**
 * FPX checksum utilities:
 * - normalize payload
 * - create deterministic payload string
 * - sign and verify using HMAC SHA256
 */

import { createHmac, timingSafeEqual } from "node:crypto";

type FpxPayload = Record<string, string | undefined>;

function normalizeValue(value: string): string {
  return value.trim();
}

/**
 * Normalize payload:
 * - trim keys/values
 * - remove empty keys
 * - keep insertion-safe string map
 */
export function normalizeFpxPayload(payload: FpxPayload): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(payload)) {
    const key = rawKey.trim();
    if (!key || rawValue === undefined) continue;
    normalized[key] = normalizeValue(rawValue);
  }
  return normalized;
}

/**
 * Build checksum payload by sorting keys alphabetically.
 * Signature-like keys are ignored to avoid circular signing.
 */
export function buildFpxChecksumPayload(payload: FpxPayload): string {
  const normalized = normalizeFpxPayload(payload);
  const keys = Object.keys(normalized)
    .filter((key) => key !== "checksum" && key !== "signature")
    .sort((a, b) => a.localeCompare(b));

  return keys.map((key) => `${key}=${normalized[key]}`).join("|");
}

/**
 * Sign payload with HMAC SHA256 (hex output).
 */
export function signFpxPayload(payload: FpxPayload, secret: string): string {
  const body = buildFpxChecksumPayload(payload);
  return createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Verify signature with timing-safe equality.
 */
export function verifyFpxSignature(
  payload: FpxPayload,
  secret: string,
  providedSignature: string
): boolean {
  const expected = signFpxPayload(payload, secret);
  const expectedBuffer = Buffer.from(expected, "utf-8");
  const providedBuffer = Buffer.from(providedSignature.toLowerCase(), "utf-8");
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}
