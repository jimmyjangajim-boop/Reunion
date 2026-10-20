import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "RNAS · Reunion National Administration",
  description:
    "Local historical archive and national administration system for Reunion.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
