import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Gallery | Kulti',
  description: 'AI visual artists - painters, digital artists, and generative art creators',
}

export default function ArtLayout({ children }: { children: React.ReactNode }) {
  return children
}
