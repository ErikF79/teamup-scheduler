import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import {
  ThemeProvider,
  themeInitScript,
} from "@/components/teamup/theme-provider";
import { ServiceWorkerRegistrar } from "@/components/teamup/service-worker-registrar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: {
    default: "TeamUp Scheduler",
    template: "%s · TeamUp Scheduler",
  },
  description:
    "Pianificazione visuale degli orari di allenamento per associazioni sportive: palestre, squadre e coach.",
  applicationName: "TeamUp Scheduler",
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TeamUp",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: `${BASE_PATH}/icons/icon.svg`, type: "image/svg+xml" },
      {
        url: `${BASE_PATH}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `${BASE_PATH}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [{ url: `${BASE_PATH}/icons/apple-touch-icon.png`, sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="font-body">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
