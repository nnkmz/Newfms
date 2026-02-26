import { randomUUID } from "node:crypto";
import { normalizeFpxPayload, signFpxPayload, verifyFpxSignature } from "./checksum.js";
import type {
  CreateFpxCheckoutInput,
  EruangniagaFpxConfig,
  FpxCheckoutSession,
  FpxPaymentStatus,
  VerifyFpxCallbackResult,
} from "./types.js";

interface NormalizedFpxConfig {
  merchantId: string;
  gatewayBaseUrl: string;
  callbackUrl: string;
  returnUrl: string;
  checksumSecret: string;
  currency: "MYR";
  checkoutPath: string;
  sessionTimeoutMinutes: number;
}

function assertNonEmpty(value: string, fieldName: string): string {
  const clean = value.trim();
  if (!clean) {
    throw new Error(`${fieldName} is required.`);
  }
  return clean;
}

function formatAmount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("amount must be a valid number greater than zero.");
  }
  return value.toFixed(2);
}

function normalizeStatusCode(statusCode: string): FpxPaymentStatus {
  const value = statusCode.trim().toUpperCase();
  if (!value) return "unknown";
  if (value === "00" || value === "SUCCESS" || value === "PAID" || value === "1") return "paid";
  if (value === "02" || value === "PENDING" || value === "3") return "pending";
  if (value === "99" || value === "FAILED" || value === "FAIL" || value === "REJECTED" || value === "0") {
    return "failed";
  }
  return "unknown";
}

function parseOptionalAmount(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function buildTransactionId(orderId: string): string {
  const slug = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "ORDER";
  const token = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
  return `FPX-${slug.toUpperCase()}-${token}`;
}

function cleanMetadataKey(key: string): string {
  return key.trim().replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
}

function normalizeConfig(config: EruangniagaFpxConfig): NormalizedFpxConfig {
  const sessionTimeoutMinutes = config.sessionTimeoutMinutes ?? 30;
  if (!Number.isInteger(sessionTimeoutMinutes) || sessionTimeoutMinutes < 1 || sessionTimeoutMinutes > 180) {
    throw new Error("sessionTimeoutMinutes must be an integer between 1 and 180.");
  }

  return {
    merchantId: assertNonEmpty(config.merchantId, "merchantId"),
    gatewayBaseUrl: assertNonEmpty(config.gatewayBaseUrl, "gatewayBaseUrl"),
    callbackUrl: assertNonEmpty(config.callbackUrl, "callbackUrl"),
    returnUrl: assertNonEmpty(config.returnUrl, "returnUrl"),
    checksumSecret: assertNonEmpty(config.checksumSecret, "checksumSecret"),
    currency: config.currency ?? "MYR",
    checkoutPath: config.checkoutPath?.trim() || "/checkout",
    sessionTimeoutMinutes,
  };
}

/**
 * Generic FPX service starter for eRuangNiaga checkout flow.
 *
 * Notes:
 * - This service prepares signed payload + callback verification.
 * - Map field names according to your actual FPX provider if needed.
 */
export class EruangniagaFpxService {
  private readonly config: NormalizedFpxConfig;

  constructor(config: EruangniagaFpxConfig) {
    this.config = normalizeConfig(config);
  }

  /**
   * Create a signed checkout session to send to FPX gateway.
   */
  createCheckoutSession(input: CreateFpxCheckoutInput): FpxCheckoutSession {
    const orderId = assertNonEmpty(input.orderId, "orderId");
    const description = assertNonEmpty(input.description, "description");
    const payerName = assertNonEmpty(input.payerName, "payerName");
    const payerEmail = assertNonEmpty(input.payerEmail, "payerEmail").toLowerCase();
    const transactionId = buildTransactionId(orderId);
    const expiresAt = new Date(Date.now() + this.config.sessionTimeoutMinutes * 60_000).toISOString();

    const payload: Record<string, string> = {
      merchant_id: this.config.merchantId,
      transaction_id: transactionId,
      order_id: orderId,
      amount: formatAmount(input.amount),
      currency: this.config.currency,
      description,
      payer_name: payerName,
      payer_email: payerEmail,
      callback_url: this.config.callbackUrl,
      return_url: this.config.returnUrl,
      expires_at: expiresAt,
      timestamp: new Date().toISOString(),
    };

    if (input.bankCode?.trim()) {
      payload.bank_code = input.bankCode.trim().toUpperCase();
    }

    if (input.metadata) {
      for (const [key, value] of Object.entries(input.metadata)) {
        const cleanKey = cleanMetadataKey(key);
        if (!cleanKey) continue;
        payload[`meta_${cleanKey}`] = value;
      }
    }

    const checksum = signFpxPayload(payload, this.config.checksumSecret);
    const formFields = { ...payload, checksum };
    const redirectUrl = joinUrl(this.config.gatewayBaseUrl, this.config.checkoutPath);

    return {
      transactionId,
      redirectUrl,
      formFields,
      expiresAt,
    };
  }

  /**
   * Verify callback payload and normalize payment status.
   */
  verifyCallback(callbackPayload: Record<string, string | undefined>): VerifyFpxCallbackResult {
    const normalizedPayload = normalizeFpxPayload(callbackPayload);
    const signature = normalizedPayload.checksum ?? normalizedPayload.signature ?? "";
    const rawStatusCode =
      normalizedPayload.status ??
      normalizedPayload.status_code ??
      normalizedPayload.fpx_txn_status ??
      "";
    const transactionId =
      normalizedPayload.transaction_id ??
      normalizedPayload.fpx_txn_id ??
      normalizedPayload.txn_id ??
      "";
    const orderId =
      normalizedPayload.order_id ??
      normalizedPayload.fpx_seller_order_no ??
      normalizedPayload.invoice_id ??
      "";
    const amount = parseOptionalAmount(normalizedPayload.amount ?? normalizedPayload.fpx_txn_amount);

    const payloadForVerification: Record<string, string> = { ...normalizedPayload };
    delete payloadForVerification.checksum;
    delete payloadForVerification.signature;
    const isSignatureValid =
      !!signature &&
      verifyFpxSignature(payloadForVerification, this.config.checksumSecret, signature);

    return {
      isSignatureValid,
      status: normalizeStatusCode(rawStatusCode),
      transactionId,
      orderId,
      amount,
      rawStatusCode,
      rawPayload: normalizedPayload,
    };
  }
}
