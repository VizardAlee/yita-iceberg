"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";

import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { mounted, resolvedTheme, setTheme } = useTheme();
  const dark = mounted && resolvedTheme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      aria-label={label}
      className={cn("shrink-0", className)}
      onClick={() => setTheme(dark ? "light" : "dark")}
      size="icon"
      title={label}
      type="button"
      variant="outline"
    >
      {dark ? <IconSun aria-hidden="true" /> : <IconMoon aria-hidden="true" />}
    </Button>
  );
}
