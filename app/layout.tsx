import type { Metadata } from "next";
import "./globals.css";
import "./navigation.css";

export const metadata: Metadata = {
  title: "Hyltekollen – Kommunpolitiken, utan protokollspråk.",
  description: "Sök möten, ärenden och originalhandlingar från Hylte kommun.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="antialiased">{children}</body>
    </html>
  );
}
