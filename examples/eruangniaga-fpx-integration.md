# Contoh Integrasi FPX (eRuangNiaga)

Dokumen ini tunjuk aliran backend ringkas untuk sistem tempahan ruang yang perlukan bayaran FPX.

## 1) Cipta pembayaran (checkout session)

```ts
import { EruangniagaFpxService, buildAutoPostForm } from "diba-ai-memory-helper";

const fpx = new EruangniagaFpxService({
  merchantId: process.env.FPX_MERCHANT_ID ?? "",
  gatewayBaseUrl: process.env.FPX_GATEWAY_URL ?? "",
  callbackUrl: "https://eruangniaga.uitm.edu.my/api/payment/fpx/callback",
  returnUrl: "https://eruangniaga.uitm.edu.my/payment/result",
  checksumSecret: process.env.FPX_CHECKSUM_SECRET ?? "",
});

// route handler: POST /api/payment/fpx/create
const checkout = fpx.createCheckoutSession({
  orderId: "ERG-2026-000888",
  amount: 80.0,
  description: "Bayaran sewa ruang mesyuarat",
  payerName: "Nur Aina",
  payerEmail: "aina@example.com",
  metadata: {
    booking_id: "BK-2401",
    campus: "ShahAlam",
  },
});

const html = buildAutoPostForm({
  actionUrl: checkout.redirectUrl,
  fields: checkout.formFields,
});

// hantar HTML ini sebagai response untuk redirect auto-submit ke FPX
```

## 2) Terima callback (server-to-server)

```ts
// route handler: POST /api/payment/fpx/callback
const verification = fpx.verifyCallback(req.body as Record<string, string | undefined>);

if (!verification.isSignatureValid) {
  // log event + pulangkan HTTP 400
}

if (verification.status === "paid") {
  // update order = PAID
} else if (verification.status === "failed") {
  // update order = FAILED
} else {
  // pending / unknown -> simpan audit log untuk semakan
}
```

## 3) Return URL (redirect pengguna)

Pada `returnUrl`, papar status tempahan berdasarkan `orderId` dalam DB, bukan semata-mata parameter URL.

## Cadangan pengukuhan (production)

- Simpan setiap callback dalam jadual audit (`raw_payload`, `received_at`, `ip_address`).
- Jadikan callback endpoint idempotent (elak update order berganda).
- Jangan hardcode `checksumSecret`; guna environment variable.
- Jika provider ada API semakan status transaksi, tambah kerja semakan berkala untuk status `pending`.
