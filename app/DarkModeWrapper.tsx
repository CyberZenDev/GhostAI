"use client"; // This component is a client component
import { useEffect } from "react";

export default function DarkModeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return <>{children}</>;
}
