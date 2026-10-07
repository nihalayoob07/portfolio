import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name}, engineer`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Link preview card: name, roles and the accent glow, matching the hero.
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "radial-gradient(circle at 78% 72%, rgba(79,125,255,0.45), rgba(79,125,255,0.06) 38%, #0a0a0c 62%)",
        backgroundColor: "#0a0a0c",
        color: "#ecebf0",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 30, color: "#93acff" }}>Hello! I&apos;m</div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 140, fontWeight: 700, lineHeight: 0.9, letterSpacing: -4 }}>
        <span>NIHAL</span>
        <span>AYOOB</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#4f7dff", letterSpacing: -1 }}>
          ENGINEER · FULL-STACK · ANDROID · 3D
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#8d8c99" }}>{site.location}</div>
      </div>
    </div>,
    size,
  );
}
