"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const storageKey = "wc2026.theme";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("theme-light", theme === "light");
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(storageKey) as Theme | null;
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-glass backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20 active:scale-95"
      aria-label="Đổi dark light theme"
      title={theme === "dark" ? "Chuyển sang light theme" : "Chuyển sang dark theme"}
    >
      {theme === "dark" ? <Moon className="h-[18px] w-[18px] text-blue-300" /> : <Sun className="h-[18px] w-[18px] text-amber-400" />}
    </button>
  );
}
