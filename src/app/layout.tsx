import "~/styles/globals.css";

import { type Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import { ConvexClientProvider } from "~/components/ConvexClientProvider";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Overmind",
  description: "Overmind challenge app",
  icons: [{ rel: "icon", url: `${basePath}/favicon.svg` }],
};

// Next.js App Router expects viewport to be exported via `export const viewport`.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-garamond",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${garamond.variable}`}>
      <body className="bg-[#020502] text-[#d1ffd6] antialiased selection:bg-[#14b8a6]/25 selection:text-[#14b8a6]">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
