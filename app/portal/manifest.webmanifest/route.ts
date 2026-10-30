export function GET() {
  return Response.json(
    {
      id: "/portal",
      name: "Durga Bari Community",
      short_name: "Durga Bari",
      description: "Your family, your giving, and your Durga Bari community.",
      start_url: "/portal",
      scope: "/",
      display: "standalone",
      background_color: "#f5f2eb",
      theme_color: "#f5f2eb",
      lang: "en",
      icons: [
        { src: "/calendar/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/calendar/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        {
          src: "/calendar/icon-maskable.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
      shortcuts: [
        { name: "Member home", url: "/portal" },
        { name: "Community calendar", url: "/calendar" },
        { name: "Giving history", url: "/portal/donations" },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
