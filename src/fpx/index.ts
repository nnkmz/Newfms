/**
 * FPX module (starter) for eRuangNiaga integration.
 */

export { EruangniagaFpxService } from "./EruangniagaFpxService.js";
export { buildAutoPostForm } from "./form.js";
export {
  buildFpxChecksumPayload,
  normalizeFpxPayload,
  signFpxPayload,
  verifyFpxSignature,
} from "./checksum.js";
export type {
  BuildAutoPostFormInput,
  CreateFpxCheckoutInput,
  EruangniagaFpxConfig,
  FpxCheckoutSession,
  FpxPaymentStatus,
  VerifyFpxCallbackResult,
} from "./types.js";
