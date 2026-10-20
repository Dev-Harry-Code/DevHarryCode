import { ImageResponse } from "next/og";

export const alt = "DevHarryCode - MaTriX Programmer";
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
          padding: "72px 78px",
          color: "#f7f7fb",
          background: "#050507",
          fontFamily: "Arial",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "760px",
            height: "760px",
            right: "-180px",
            top: "-300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #4242ff55 0%, #05050700 68%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "580px",
            height: "580px",
            left: "-260px",
            bottom: "-350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #9b5cff44 0%, #05050700 68%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: "30px", fontWeight: 700 }}>
          <span>DevHarryCode</span>
          <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#6f7dff" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "900px" }}>
          <div style={{ fontSize: "76px", lineHeight: 1.02, fontWeight: 800, letterSpacing: "-4px" }}>
            MaTriX Programmer
          </div>
          <div style={{ fontSize: "28px", color: "#b9bbc8", lineHeight: 1.3 }}>
            Creative engineering for immersive interfaces and intelligent digital experiences.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", color: "#777b8f", fontSize: "20px" }}>
          <span>devharrycode.vercel.app</span>
          <span>Creative developer / full-stack builder</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
