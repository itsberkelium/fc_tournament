import { ImageResponse } from "next/og";
import { iconDataUri } from "@/lib/icon-svg";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const { width, height } = size;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width, height }}>
        <img src={iconDataUri()} style={{ width, height }} />
      </div>
    ),
    { ...size }
  );
}
