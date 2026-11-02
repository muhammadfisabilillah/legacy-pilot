import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "LegacyPilot — AI remote control for legacy apps",
  description:
    "Describe a task in natural language and watch an AI agent operate a legacy clinic application that has no integration API.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
