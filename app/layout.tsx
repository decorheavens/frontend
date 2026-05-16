import type { Metadata } from "next";
import Script from "next/script";
import { AppShell } from "@/components/shared/app-shell";
import { STORE_NAME } from "@/lib/constants";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";


export const viewport = {
  width: "device-width",
  initialScale: 1,
};


export const metadata: Metadata = {
  metadataBase: new URL(process.env.FRONTEND_URL ?? "http://localhost:3000"),
  title: {
    default: `${STORE_NAME} | Decorative Lighting Store`,
    template: `%s | ${STORE_NAME}`,
  },
  description: "Shop decorative lighting for cafes, events, gifting setups, and custom spaces.",
  keywords: [
    "decorative lights",
    "decor lighting",
    "ambient lights",
    "event lighting",
    "cafe lights",
    "party lights",
  ],
  openGraph: {
    title: STORE_NAME,
    description: "A modern online store for decorative lights with ecommerce-ready flows.",
    siteName: STORE_NAME,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-55QQHVV105"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-55QQHVV105');
          `}
        </Script>
      </head>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
