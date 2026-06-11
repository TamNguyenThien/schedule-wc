import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lịch Thi Đấu World Cup 2026",
    short_name: "WC 2026",
    description: "Lịch thi đấu, bảng xếp hạng và đội yêu thích World Cup 2026.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#be123c",
    lang: "vi",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
