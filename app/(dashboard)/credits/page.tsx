import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreditsOverview } from "@/components/credits/credits-overview"
import { TransactionHistory } from "@/components/credits/transaction-history"
import { CreditsMilestones } from "@/components/credits/credits-milestones"
import { CreditsLeaderboard } from "@/components/credits/credits-leaderboard"

export default async function CreditsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-mono text-5xl md:text-6xl font-bold mb-4">
            <span className="text-accent mr-4">&gt;</span>Credits
          </h1>
          <p className="text-2xl text-muted-2">
            Track your earnings and see how you stack up
          </p>
        </div>

        {/* Overview Cards */}
        <CreditsOverview userId={user.id} />

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8 mt-12">
          {/* Left Column - Transaction History (2/3 width) */}
          <div className="lg:col-span-2">
            <TransactionHistory userId={user.id} />
          </div>

          {/* Right Column - Milestones & Leaderboard (1/3 width) */}
          <div className="space-y-8">
            <CreditsMilestones userId={user.id} />
            <CreditsLeaderboard currentUserId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
