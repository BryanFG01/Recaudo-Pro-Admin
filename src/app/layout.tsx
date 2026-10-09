import "../index.css";
import React from "react";
import type { Metadata } from "next";
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "../components/theme/ThemeProvider";

// Tipografías de DESIGN.MD: cuerpo (Inter), titulares condensados (Barlow Condensed) y etiquetas (JetBrains Mono)
const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontDisplay = Barlow_Condensed({ subsets: ["latin"], weight: "700", variable: "--font-display" });
const fontMono = JetBrains_Mono({ subsets: ["latin"], weight: "400", variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Recaudo Pro Admin",
  description: "Administrative Dashboard",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
