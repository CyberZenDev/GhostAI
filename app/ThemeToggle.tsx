"use client"; // This component is a client component
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDark);
    // Apply dark mode based on the initial preference
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add("dark"); // Add dark class
    } else {
      document.documentElement.classList.remove("dark"); // Remove dark class
    }
  };

  return (
    <div className="absolute top-4 left-4">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isDarkMode}
          onChange={toggleTheme}
          className="hidden"
        />
        <div className="relative">
          <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
          <div
            className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
              isDarkMode ? "translate-x-full bg-gray-300" : ""
            }`}
          ></div>
        </div>
        {/* Change text color based on the theme */}
        <span className={`ml-2 text-sm ${isDarkMode ? "text-white" : "text-black"}`}>
          {isDarkMode ? "Dark Mode" : "Light Mode"}
        </span>
      </label>
    </div>
  );
}
