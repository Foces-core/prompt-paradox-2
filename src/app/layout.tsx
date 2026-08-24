import "~/styles/globals.css";

import { type Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import { ConvexClientProvider } from "~/components/ConvexClientProvider";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const SITE_URL = "https://foces-core.github.io/prompt-paradox-2-/";

export const metadata: Metadata = {
  title: "Overmind",
  description:
    "Prompt Paradox 2 — the Signal Trials puzzle event by FOCES. Solve cryptographic riddles, decode hidden messages, and climb the leaderboard.",
  icons: [{ rel: "icon", url: `${basePath}/favicon.svg` }],
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": -1,
      "max-image-preview": "none",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Overmind — Prompt Paradox 2",
    description:
      "Prompt Paradox 2 — the Signal Trials puzzle event by FOCES. Solve cryptographic riddles, decode hidden messages, and climb the leaderboard.",
    siteName: "Prompt Paradox 2",
    images: [
      {
        url: `${SITE_URL}og-image.png`,
        width: 1200,
        height: 630,
        alt: "Prompt Paradox 2 — Signal Trials",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Overmind — Prompt Paradox 2",
    description:
      "Prompt Paradox 2 — the Signal Trials puzzle event by FOCES. Solve cryptographic riddles, decode hidden messages, and climb the leaderboard.",
    images: [`${SITE_URL}og-image.png`],
  },
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
