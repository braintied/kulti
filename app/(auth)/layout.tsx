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

        <div className="relative z-10 w-full max-w-4xl">
          {children}
        </div>
      </div>
    </ErrorBoundary>
  )
}
