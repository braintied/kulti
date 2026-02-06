import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { PhoneLoginForm } from "@/components/auth/phone-login-form"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"

export default function LoginPage() {
  return (
    <main className="space-y-12 animate-fade-in">
      <div className="text-center space-y-6">
        <h1 className="text-3xl md:text-6xl font-bold font-mono">Welcome Back</h1>
        <p className="text-lg md:text-2xl text-muted-2">Sign in to your Kulti account</p>
      </div>

      <div className="bg-surface-1/50 backdrop-blur-sm border border-border-default rounded-2xl p-6 md:p-12 hover:border-accent/30 transition-all duration-300">
        <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
          <Tabs defaultValue="phone">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="phone">Phone</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="phone">
              <PhoneLoginForm />
            </TabsContent>

            <TabsContent value="email">
              <LoginForm />
            </TabsContent>
          </Tabs>
        </Suspense>
      </div>

      <div className="text-center space-y-3">
        <p className="text-base md:text-lg text-muted-3">
          Don't have an account?{' '}
          <Link href="/signup" className="text-accent hover:text-accent/80 transition-colors">
            Sign up
          </Link>
        </p>
        <p className="text-base md:text-lg text-muted-3">
          <Link href="/" className="hover:text-accent transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}
