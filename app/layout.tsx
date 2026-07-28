import type { Metadata, Viewport } from "next";
import "./globals.css";

import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { ThemeProvider } from "@/components/theme/theme-provider";

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("yita-theme");
    const dark = stored === "dark" ||
      ((stored === null || stored === "system") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    document.querySelectorAll('meta[name="theme-color"]').forEach((element) => {
      element.setAttribute("content", dark ? "#172033" : "#eef4f9");
    });
  } catch {}
})();
`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eef4f9",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL || "http://localhost:3000"),
  applicationName: "YITA Iceberg",
  title: "YITA Iceberg — Ice Production, Sales & Inventory Control",
  description:
    "Multi-branch ice production and distribution operations with controlled inventory, payment verification, release approval, and audit-ready reporting.",
  openGraph: {
    title: "YITA Iceberg — Ice Production, Sales & Inventory Control",
    description:
      "Secure ice-block inventory, sales, payment verification, dispatch approval, and branch oversight.",
    images: ["/brand/yita-iceberg-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "YITA Iceberg — Ice Production, Sales & Inventory Control",
    description:
      "Multi-branch ice production and distribution with secure operational control.",
    images: ["/brand/yita-iceberg-logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YITA Iceberg",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
