import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Prompt Paradox 2.0",
  description: "Signal Trials event app",
  icons: [{ rel: "icon", url: `${basePath}/favicon.ico` }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>{children}</body>
    </html>
  );
}
