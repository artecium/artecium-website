import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Artecium — Websites, AI, Automation & SEO for Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #050816 0%, #0E1324 55%, #111827 100%)",
          padding: "72px 80px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ fontSize: "34px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Artecium
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px" }}>
          <div
            style={{
              fontSize: "58px",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
            }}
          >
            Websites that help businesses grow
          </div>
          <div
            style={{
              fontSize: "28px",
              lineHeight: 1.4,
              color: "#94A3B8",
              maxWidth: "820px",
            }}
          >
            AI, automation, SEO and web applications for companies in Portugal
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#64748B",
            fontSize: "24px",
          }}
        >
          <span>artecium.com</span>
          <span>Portugal</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
