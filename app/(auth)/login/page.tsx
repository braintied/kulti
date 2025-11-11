import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="space-y-12 animate-fade-in">
      <div className="text-center space-y-6">
        <h1 className="text-6xl md:text-7xl font-bold font-mono">Welcome Back</h1>
        <p className="text-2xl md:text-3xl text-[#a1a1aa]">Sign in to your Kulti account</p>
      </div>

      <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-[#27272a] rounded-2xl p-12 hover:border-[#00ff88]/30 transition-all duration-300">
        <LoginForm />
      </div>

      <p className="text-center text-lg text-[#71717a]">
        <Link href="/" className="hover:text-[#00ff88] transition-colors">
          ← Back to home
        </Link>
      </p>
    </div>
  )
}
