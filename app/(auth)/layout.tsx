import type { Metadata } from "next";

import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="fixed right-4 top-[calc(1rem+env(safe-area-inset-top))] z-50">
        <ThemeToggle />
      </div>
      {children}
    </>
  );
}
