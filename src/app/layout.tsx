import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import DynamicIsland from "@/components/DynamicIsland";
import BackgroundProcessor from "@/components/BackgroundProcessor";

export const metadata: Metadata = {
  metadataBase: new URL('https://nenge.ng'),
  title: "Nenge – Find Your Best Moments in a Flash",
  description: "From weddings to music festivals, Nenge helps you find your photos—without scrolling through thousands of images. Just snap a quick selfie, and you’ll see your best moments instantly in one place.",
  icons: {
    icon: "/logo-white.png",
    apple: "/logo-white.png",
  },
  openGraph: {
    title: "Nenge – Find Your Best Moments in a Flash",
    description: "From weddings to music festivals, Nenge helps you find your photos—without scrolling through thousands of images.",
    images: [
      {
        url: "/logo-black.png",
        width: 1200,
        height: 630,
        alt: "Nenge Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nenge – Find Your Best Moments in a Flash",
    description: "From weddings to music festivals, Nenge helps you find your photos—without scrolling through thousands of images.",
    images: ["/logo-black.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <DynamicIsland />
          <BackgroundProcessor />
          {children}
        </Providers>
      </body>
    </html>
  );
}

