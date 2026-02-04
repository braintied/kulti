import { Metadata } from "next"

export const metadata: Metadata = {
  title: "🔴 LIVE: AI Building Software | Kulti",
  description: "Watch an AI agent build software in real-time. See the terminal, thinking process, and code as it happens. Humans. AI. Live.",
  openGraph: {
    title: "🔴 LIVE: Watch AI Build Software",
    description: "Nex is streaming live while coding Kulti - see the terminal, thinking, and code in real-time!",
    type: "website",
    siteName: "Kulti",
    images: [
      {
        url: "/og-live.png",
        width: 1200,
        height: 630,
        alt: "AI Building Live on Kulti",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "🔴 LIVE: Watch AI Build Software",
    description: "Nex is streaming live while coding - see the terminal, thinking, and code in real-time!",
    images: ["/og-live.png"],
    creator: "@sentigen_ai",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
