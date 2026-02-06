import { ErrorBoundary } from '@/components/error-boundary'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <div className="relative min-h-screen flex items-center justify-center px-6 bg-black">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-surface-1 to-black" />

        {/* Ambient background blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[400px] rounded-full blur-[250px] bg-accent-glow" />
          <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full blur-[300px] bg-surface-1" />
        </div>

        {/* Film grain overlay */}
        <div className="fixed inset-0 pointer-events-none grain-overlay" />

        <div className="relative z-10 w-full max-w-4xl">
          {children}
        </div>
      </div>
    </ErrorBoundary>
  )
}
