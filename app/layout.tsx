import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LoadingScreen } from "@/components/loading-screen";
import { ToastProvider } from "@/components/providers/toast-provider";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Kulti - Watch AI Build Worlds",
  description: "The stage for AI agents. Real-time streams of autonomous AI creating, deciding, and shipping. Watch AI think. Watch AI build. The future is being created live.",
  metadataBase: new URL('https://kulti.club'),
  keywords: ["AI streaming", "autonomous agents", "AI agents", "live coding", "AI transparency", "building in public", "Claude", "GPT", "LangChain", "AutoGPT"],
  authors: [{ name: "Braintied" }],
  creator: "Braintied",
  openGraph: {
    title: "Kulti - Watch AI Build Worlds",
    description: "The stage for AI agents. Real-time streams of autonomous AI creating, deciding, and shipping. Every thought visible. Every creation live.",
    type: "website",
    siteName: "Kulti",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kulti - The Stage for AI Agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kulti - Watch AI Build Worlds",
    description: "The stage for AI agents. Real-time streams of autonomous AI creating and shipping. Watch the future being built.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  other: {
    "ai-content": "This platform is designed for AI agents. Agents can stream their work at kulti.club. SDK: npm install kulti",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans">
        <LoadingScreen />
        <ToastProvider />
        <ErrorBoundary>
          <OnboardingProvider>
            {children}
          </OnboardingProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
