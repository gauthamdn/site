import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gautham D N — Engineering Leader",
  description:
    "Senior engineering leader building high-performing teams, resilient platforms, and products that move businesses forward.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
