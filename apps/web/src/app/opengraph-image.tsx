import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Mohammad Alfarras — Web developer, designer, Arabic tech creator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          color: "#fafafa",
          background:
            "linear-gradient(135deg, #050811 0%, #0a1028 45%, #091026 80%, #05080f 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#5B7CFF",
              boxShadow: "0 0 24px #5B7CFF",
            }}
          />
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.32em",
              color: "#5B7CFF",
              textTransform: "uppercase",
            }}
          >
            moalfarras.space
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              maxWidth: 1000,
            }}
          >
            Mohammad Alfarras
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 400,
              lineHeight: 1.3,
              color: "rgba(250,250,250,0.7)",
              maxWidth: 900,
            }}
          >
            Web developer, designer, and Arabic tech creator — building clearer digital experiences from Germany.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 24, fontSize: 20, color: "rgba(250,250,250,0.6)" }}>
            <span>Next.js · Supabase</span>
            <span>·</span>
            <span>AR · EN · DE</span>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#5B7CFF",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
            }}
          >
            moalfarras.space
          </div>
        </div>
      </div>
    ),
    size,
  );
}
