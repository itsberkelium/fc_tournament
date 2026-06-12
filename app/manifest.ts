import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = "EA FC 26 Ligi";
  try {
    const settings = await getSettings();
    name = settings.tournamentName;
  } catch {
    // DB unavailable at build time; use default
  }

  return {
    name,
    short_name: name,
    description: "FC Turnuva Yöneticisi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#15803d",
    icons: [
      {
        src: "/app-icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
