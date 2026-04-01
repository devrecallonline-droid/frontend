import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import DynamicIsland from "@/components/DynamicIsland";
import BackgroundProcessor from "@/components/BackgroundProcessor";

export const metadata: Metadata = {
  title: "Memzo - Find Your Event Photos Instantly",
  description: "Memzo is the world's first privacy-first event photo platform. Snap a selfie, find every photo of you — without anyone ever seeing your face.",
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

