type EmailRow = [string, string];

export function escapeEmailHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function cinematicEmailHtml({
  direction,
  eyebrow,
  title,
  intro,
  rows,
  body,
  tone = "info",
}: {
  direction: "rtl" | "ltr";
  eyebrow: string;
  title: string;
  intro: string;
  rows: EmailRow[];
  body: string;
  tone?: "info" | "success" | "warning" | "danger";
}) {
  const accent = tone === "danger" ? "#fb7185" : tone === "warning" ? "#f4b860" : tone === "success" ? "#34d399" : "#22d3ee";
  const rowHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #26324a;color:#9fb2d8;font-size:13px;font-weight:800">${escapeEmailHtml(label)}</td>
          <td style="padding:14px 0;border-bottom:1px solid #26324a;color:#ffffff;font-size:14px;font-weight:900;text-align:${direction === "rtl" ? "left" : "right"}">${escapeEmailHtml(value)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta name="color-scheme" content="dark light">
    <meta name="supported-color-schemes" content="dark light">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background:#050816;color:#eef6ff;font-family:Arial,Helvetica,sans-serif;direction:${direction}">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#050816">
      <tr>
        <td align="center" style="padding:28px 14px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;border-collapse:collapse">
            <tr>
              <td style="border:1px solid #26324a;border-radius:30px;overflow:hidden;background:#0b1224;box-shadow:0 28px 80px rgba(0,0,0,.42)">
                <div style="padding:30px 28px;background:linear-gradient(135deg,rgba(34,211,238,.24),rgba(99,102,241,.16) 48%,rgba(244,184,96,.14));border-bottom:1px solid #26324a">
                  <div style="display:inline-block;border:1px solid rgba(34,211,238,.45);border-radius:999px;padding:8px 12px;background:rgba(5,8,22,.62);color:${accent};font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase">${escapeEmailHtml(eyebrow)}</div>
                  <h1 style="margin:20px 0 0;color:#ffffff;font-size:34px;line-height:1.12;letter-spacing:-.04em;font-weight:900">${escapeEmailHtml(title)}</h1>
                  <p style="margin:16px 0 0;color:#d8e6ff;font-size:16px;line-height:1.8">${escapeEmailHtml(intro)}</p>
                </div>
                <div style="padding:26px 28px 30px">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:22px">
                    ${rowHtml}
                  </table>
                  <div style="border:1px solid #2f3d5c;border-radius:24px;background:#111a30;padding:22px;color:#ffffff;font-size:17px;line-height:1.9;font-weight:700">
                    ${escapeEmailHtml(body).replace(/\n/g, "<br>")}
                  </div>
                  <div style="margin-top:24px;border-top:1px solid #26324a;padding-top:18px;color:#9fb2d8;font-size:13px;line-height:1.7">
                    <strong style="display:block;color:#ffffff;font-size:15px">Moalfarras.space</strong>
                    Website, apps, activation, and admin control center.
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
