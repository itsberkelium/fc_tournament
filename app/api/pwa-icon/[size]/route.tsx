import { ImageResponse } from "next/og";
import { iconDataUri } from "@/lib/icon-svg";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const s = Math.min(Math.max(parseInt(sizeParam) || 192, 16), 512);
  const uri = iconDataUri();

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: s, height: s }}>
        <img src={uri} style={{ width: s, height: s }} />
      </div>
    ),
    { width: s, height: s }
  );
}
