"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mounted: boolean;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  theme: ThemePreference;
};

const storageKey = "yita-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function applyTheme(theme: ThemePreference) {
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.style.colorScheme = resolvedTheme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((element) => {
    element.setAttribute(
      "content",
      resolvedTheme === "dark" ? "#172033" : "#eef4f9",
    );
  });

  return resolvedTheme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(storageKey);
    setThemeState(isThemePreference(storedTheme) ? storedTheme : "system");
    setMounted(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function updateTheme() {
      setResolvedTheme(applyTheme(theme));
    }

    updateTheme();
    media.addEventListener("change", updateTheme);

    return () => media.removeEventListener("change", updateTheme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mounted,
      resolvedTheme,
      setTheme(nextTheme) {
        window.localStorage.setItem(storageKey, nextTheme);
        setThemeState(nextTheme);
      },
      theme,
    }),
    [mounted, resolvedTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
