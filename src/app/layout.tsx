import "~/styles/globals.css";

import { type Metadata } from "next";
import { Space_Mono } from "next/font/google";
import { ConvexClientProvider } from "~/components/ConvexClientProvider";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Prompt Paradox 2.0",
  description: "Signal Trials event app",
  icons: [{ rel: "icon", url: `${basePath}/favicon.svg` }],
};

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceMono.variable}`}>
      <body className="bg-[#020502] text-[#d1ffd6] antialiased selection:bg-[#00ff66]/25 selection:text-[#00ff66]">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
