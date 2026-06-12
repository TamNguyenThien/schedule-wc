import type { Metadata } from "next";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "WC 2026",
  title: "Lịch Thi Đấu World Cup 2026",
  description: "Dashboard lịch thi đấu, bảng xếp hạng và sơ đồ nhánh World Cup 2026.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WC 2026"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png"
  }
};

export const viewport = {
  themeColor: "#be123c",
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeScript = `
    try {
      var theme = window.localStorage.getItem("wc2026.theme");
      if (theme !== "dark") {
        document.documentElement.classList.add("theme-light");
        document.documentElement.style.colorScheme = "light";
      }
    } catch (_) {}
  `;

  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
