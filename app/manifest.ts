import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "YITA Iceberg Staff Operations",
    short_name: "YITA Iceberg",
    description:
      "Secure multi-branch inventory, sales, payment, release, and reporting operations for YITA Iceberg staff.",
    start_url: "/sign-in",
    scope: "/",
    display: "standalone",
    background_color: "#eef4f9",
    theme_color: "#eef4f9",
    lang: "en",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/yita-iceberg-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/yita-iceberg-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/yita-iceberg-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
