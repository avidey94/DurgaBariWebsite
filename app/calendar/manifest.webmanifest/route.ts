export function GET() {
  return Response.json(
    {
      id: "/calendar",
      name: "Durga Bari Calendar",
      short_name: "Durga Bari",
      description: "A place for worship, festivals, and community. Your Durga Bari calendar.",
      start_url: "/calendar",
      scope: "/calendar",
      display: "standalone",
      background_color: "#f6f3ed",
      theme_color: "#191713",
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
        { name: "This month", url: "/calendar" },
        { name: "Agenda", url: "/calendar?view=agenda" },
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
