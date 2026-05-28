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
  const accent = tone === "danger" ? "#be123c" : tone === "warning" ? "#b45309" : tone === "success" ? "#047857" : "#0369a1";
  const rowHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#475569;font-size:13px;font-weight:800">${escapeEmailHtml(label)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:900;text-align:${direction === "rtl" ? "left" : "right"}">${escapeEmailHtml(value)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="${direction === "rtl" ? "ar" : "en"}" dir="${direction}">
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="dark light">
    <meta name="supported-color-schemes" content="dark light">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;color:#0f172a;font-family:Arial,Tahoma,Helvetica,sans-serif;direction:${direction};text-align:${direction === "rtl" ? "right" : "left"}">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc">
      <tr>
        <td align="center" style="padding:20px 12px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;border-collapse:collapse">
            <tr>
              <td style="border:1px solid #cbd5e1;border-radius:18px;overflow:hidden;background:#ffffff;box-shadow:0 12px 32px rgba(15,23,42,.10)">
                <div style="padding:26px 24px;background:#ffffff;border-bottom:1px solid #e2e8f0">
                  <div style="display:inline-block;border-radius:999px;padding:7px 11px;background:#eff6ff;color:${accent};font-size:12px;font-weight:900">${escapeEmailHtml(eyebrow)}</div>
                  <h1 style="margin:18px 0 0;color:#0f172a;font-size:30px;line-height:1.25;font-weight:900">${escapeEmailHtml(title)}</h1>
                  <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.8">${escapeEmailHtml(intro)}</p>
                </div>
                <div style="padding:24px">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:22px">
                    ${rowHtml}
                  </table>
                  <div style="border:1px solid #cbd5e1;border-radius:16px;background:#f8fafc;padding:20px;color:#0f172a;font-size:17px;line-height:1.9;font-weight:700;white-space:normal">
                    ${escapeEmailHtml(body).replace(/\n/g, "<br>")}
                  </div>
                  <div style="margin-top:22px;border-top:1px solid #e2e8f0;padding-top:16px;color:#475569;font-size:13px;line-height:1.7">
                    <strong style="display:block;color:#0f172a;font-size:15px">Moalfarras.space</strong>
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
