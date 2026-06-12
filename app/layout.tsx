import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
};

const DEFAULT_NAME = "EA FC 26 Ligi";

export async function generateMetadata(): Promise<Metadata> {
  let name = DEFAULT_NAME;
  try {
    const settings = await getSettings();
    name = settings.tournamentName;
  } catch {
    // DB unavailable at build time; use default
  }

  return {
    title: name,
    description: "FC Turnuva Yöneticisi",
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
      shortcut: "/favicon.ico",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: name,
    },
    formatDetection: { telephone: false },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${openSans.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <PwaInstallBanner />
      </body>
    </html>
  );
}
