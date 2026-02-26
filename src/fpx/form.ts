import type { BuildAutoPostFormInput } from "./types.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Build an auto-submit HTML form for POST-based FPX redirect.
 */
export function buildAutoPostForm(input: BuildAutoPostFormInput): string {
  const actionUrl = input.actionUrl.trim();
  if (!actionUrl) {
    throw new Error("actionUrl is required.");
  }

  const formId = input.formId?.trim() || "fpx-checkout-form";
  const fields = Object.entries(input.fields)
    .map(([key, value]) => {
      return `      <input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}" />`;
    })
    .join("\n");

  return [
    "<!doctype html>",
    '<html lang="ms">',
    "  <head>",
    '    <meta charset="utf-8" />',
    "    <title>Redirect FPX</title>",
    "  </head>",
    "  <body>",
    `    <form id="${escapeHtml(formId)}" method="post" action="${escapeHtml(actionUrl)}">`,
    fields,
    "      <noscript>",
    '        <p>JavaScript dimatikan. Sila klik butang di bawah untuk teruskan pembayaran FPX.</p>',
    '        <button type="submit">Teruskan ke FPX</button>',
    "      </noscript>",
    "    </form>",
    "    <script>",
    `      document.getElementById(${JSON.stringify(formId)})?.submit();`,
    "    </script>",
    "  </body>",
    "</html>",
  ].join("\n");
}
