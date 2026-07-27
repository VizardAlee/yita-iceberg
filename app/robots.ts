import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy"],
      disallow: [
        "/api/",
        "/offline.html",
        "/sign-in",
        "/forgot-password",
        "/dashboard",
        "/profile",
        "/orders",
        "/customers",
        "/cashier",
        "/release",
        "/inventory",
        "/reversals",
        "/branches",
        "/catalog",
        "/access",
        "/reports",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
