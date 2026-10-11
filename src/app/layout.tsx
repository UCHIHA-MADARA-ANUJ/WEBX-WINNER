import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anuj Phulera — the impossible interface",
  description:
    "A portfolio with no fixed layout. It observes how you browse and physically rebuilds itself around you — magazine, constellation, swipe deck or orbit.",
  openGraph: {
    title: "Anuj Phulera — the impossible interface",
    description: "A portfolio with no fixed layout. It rebuilds itself around you.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="bg-noise" aria-hidden="true" />
        <div className="scanline" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
