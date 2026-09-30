import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Emotion-Responsive Smart Lighting",
  description:
    "Smart lighting that adapts illumination to the user's emotional state to create personalised, immersive environments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
