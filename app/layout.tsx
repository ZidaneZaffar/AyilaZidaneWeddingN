import "./globals.css";
import type { Metadata } from "next";
import { getContent } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return {
    title: c.meta.title,
    description: c.meta.description,
    openGraph: {
      title: c.meta.title,
      description: c.meta.description,
      images: c.meta.ogImage ? [{ url: c.meta.ogImage, width: 1200, height: 630 }] : [],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#141414" />
      </head>
      <body>{children}</body>
    </html>
  );
}
