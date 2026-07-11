import {
  BUDGET_LABELS,
  PROJECT_TYPE_LABELS,
  REFERRAL_LABELS,
  TIMELINE_LABELS,
  type ProjectDiscoveryData,
} from "@/types/project";

const BRAND = {
  background: "#050816",
  card: "#0E1324",
  cardInner: "#0A0F1E",
  border: "#1E293B",
  borderAccent: "#2563EB33",
  primary: "#2563EB",
  primaryLight: "#60A5FA",
  text: "#FFFFFF",
  muted: "#94A3B8",
  mutedDark: "#64748B",
  highlight: "#0D1B3E",
  highlightBorder: "#2563EB40",
  website: "https://artecium.com",
  logoUrl: "https://artecium.com/artecium-logo.png",
} as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMultiline(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

export function generateDiscoveryId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `ART-${year}-${random}`;
}

export function getDiscoveryEmailSubject(data: ProjectDiscoveryData): string {
  return `🚀 New Project Request • ${data.name}`;
}

function renderFieldRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding:0 0 4px 0;font-size:11px;line-height:16px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.mutedDark};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              ${escapeHtml(label)}
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;line-height:22px;font-weight:500;color:${BRAND.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              ${escapeHtml(value)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderCard(title: string, icon: string, rows: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px 0;background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:24px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:0 0 20px 0;">
                <span style="display:inline-block;font-size:18px;line-height:1;margin-right:8px;vertical-align:middle;">${icon}</span>
                <span style="font-size:16px;line-height:24px;font-weight:600;color:${BRAND.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;vertical-align:middle;">
                  ${escapeHtml(title)}
                </span>
              </td>
            </tr>
            ${rows}
          </table>
        </td>
      </tr>
    </table>
  `;
}

export function renderDiscoveryBriefHtml(data: ProjectDiscoveryData): string {
  const discoveryId = generateDiscoveryId();
  const company = data.company.trim() || "—";
  const service = data.projectType
    ? PROJECT_TYPE_LABELS[data.projectType]
    : "—";
  const budget = data.budget ? BUDGET_LABELS[data.budget] : "—";
  const timeline = data.timeline ? TIMELINE_LABELS[data.timeline] : "—";
  const referral = data.referral ? REFERRAL_LABELS[data.referral] : "—";

  const clientRows = [
    renderFieldRow("Name", data.name),
    renderFieldRow("Email", data.email),
    renderFieldRow("Company", company),
  ].join("");

  const projectRows = [
    renderFieldRow("Service", service),
    renderFieldRow("Estimated Budget", budget),
    renderFieldRow("Timeline", timeline),
    renderFieldRow("Referral Source", referral),
  ].join("");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>New Project Discovery</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .content-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .header-padding { padding: 32px 20px 24px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.background};color:${BRAND.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    New project discovery from ${escapeHtml(data.name)} — ${escapeHtml(service)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.background};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Main container -->
        <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td class="header-padding" style="padding:40px 32px 32px 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:0 0 24px 0;">
                    <img src="${BRAND.logoUrl}" alt="Artecium" width="40" height="40" style="display:block;width:40px;height:40px;border-radius:8px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 8px 0;">
                    <span style="display:inline-block;padding:6px 14px;background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:999px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.primaryLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      ${escapeHtml(discoveryId)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:16px 0 8px 0;font-size:28px;line-height:34px;font-weight:600;letter-spacing:-0.02em;color:${BRAND.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    🚀 New Project Discovery
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:15px;line-height:24px;color:${BRAND.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    A new potential client has submitted a Discovery Brief.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="content-padding" style="padding:0 32px 32px 32px;">

              ${renderCard("Client Information", "👤", clientRows)}
              ${renderCard("Project Information", "💻", projectRows)}

              <!-- Project Description -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px 0;background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:0 0 16px 0;">
                          <span style="display:inline-block;font-size:18px;line-height:1;margin-right:8px;vertical-align:middle;">📝</span>
                          <span style="font-size:16px;line-height:24px;font-weight:600;color:${BRAND.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;vertical-align:middle;">
                            Project Description
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 22px;background-color:${BRAND.cardInner};border:1px solid ${BRAND.border};border-radius:12px;font-size:15px;line-height:26px;color:${BRAND.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                          ${formatMultiline(data.description)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next Step -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px 0;background-color:${BRAND.highlight};border:1px solid ${BRAND.highlightBorder};border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:22px 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:0 0 6px 0;font-size:11px;line-height:16px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.primaryLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                          Next Step
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size:15px;line-height:24px;color:${BRAND.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                          Reply directly to this email to continue the conversation with the client.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 40px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${BRAND.border};">
                <tr>
                  <td align="center" style="padding:28px 0 0 0;font-size:14px;line-height:20px;font-weight:600;color:${BRAND.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    Artecium
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:4px 0 0 0;font-size:13px;line-height:20px;color:${BRAND.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    Building modern software experiences.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:12px 0 0 0;">
                    <a href="${BRAND.website}" style="font-size:13px;line-height:20px;color:${BRAND.primaryLight};text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      ${BRAND.website.replace("https://", "")}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
