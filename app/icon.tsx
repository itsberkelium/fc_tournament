import { ImageResponse } from "next/og";
import { iconDataUri } from "@/lib/icon-svg";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
