/**
 * FPX starter types for eRuangNiaga integration.
 */

export type FpxPaymentStatus = "pending" | "paid" | "failed" | "unknown";

export interface EruangniagaFpxConfig {
  merchantId: string;
  gatewayBaseUrl: string;
  callbackUrl: string;
  returnUrl: string;
  checksumSecret: string;
  currency?: "MYR";
  checkoutPath?: string;
  sessionTimeoutMinutes?: number;
}

export interface CreateFpxCheckoutInput {
  orderId: string;
  amount: number;
  description: string;
  payerName: string;
  payerEmail: string;
  bankCode?: string;
  metadata?: Record<string, string>;
}

export interface FpxCheckoutSession {
  transactionId: string;
  redirectUrl: string;
  formFields: Record<string, string>;
  expiresAt: string;
}

export interface VerifyFpxCallbackResult {
  isSignatureValid: boolean;
  status: FpxPaymentStatus;
  transactionId: string;
  orderId: string;
  amount?: number;
  rawStatusCode: string;
  rawPayload: Record<string, string>;
}

export interface BuildAutoPostFormInput {
  actionUrl: string;
  fields: Record<string, string>;
  formId?: string;
}
