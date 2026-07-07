import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ledger = IBM_Plex_Mono({
  variable: "--font-ledger",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Bitacora - BryanF Design",
  description:
    "Portal privado de BryanF Design para proyectos, entregables, recursos, pagos y saldo.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      className={`${display.variable} ${body.variable} ${ledger.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink font-body text-paper">{children}</body>
    </html>
  );
}
