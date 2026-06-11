import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lịch Thi Đấu World Cup 2026",
  description: "Dashboard lịch thi đấu, bảng xếp hạng và sơ đồ nhánh World Cup 2026."
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
        {children}
      </body>
    </html>
  );
}
