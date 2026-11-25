import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bangla UI Doctor — Futuristic Bengali Web & Accessibility Auditor",
  description:
    "Developer-focused Bengali website quality, Unicode, accessibility, typography, and responsive layout diagnostic platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${notoSansBengali.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
