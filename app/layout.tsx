import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AI } from "./actions";
import DarkModeWrapper from "./DarkModeWrapper";
import ThemeToggle from "./ThemeToggle"; // Import the ThemeToggle component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GhostAI",
  description: "The Simplest Feature Packed and Secure Open Source AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <DarkModeWrapper>
          <ThemeToggle /> {/* Add the ThemeToggle here */}
          <AI>{children}</AI>
        </DarkModeWrapper>
      </body>
    </html>
  );
}
