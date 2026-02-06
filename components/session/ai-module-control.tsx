"use client"

import { useState } from "react"
import { Bot, Settings, Power } from "lucide-react"
import type { AIPermissions } from "@/lib/session"

interface AIModuleControlProps {
  permissions: AIPermissions
  onOpenSettings: () => void
  onToggle: (enabled: boolean) => Promise<void>
}

export function AIModuleControl({
  permissions,
  onOpenSettings,
  onToggle,
}: AIModuleControlProps) {
  const [toggling, setToggling] = useState(false)

  if (!permissions.canToggle) {
    return null // Only show for hosts
  }

  const handleQuickToggle = async () => {
    setToggling(true)
    try {
      await onToggle(!permissions.moduleEnabled)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-surface-1 border border-border-default rounded-lg">
      {/* AI Icon */}
      <div className={`p-1.5 rounded-lg ${
        permissions.moduleEnabled
          ? "bg-purple-500/10"
          : "bg-surface-2"
      }`}>
        <Bot className={`w-4 h-4 ${
          permissions.moduleEnabled
            ? "text-purple-500"
            : "text-muted-3"
        }`} />
      </div>

      {/* Status */}
      <div className="flex flex-col">
        <span className="text-xs font-medium">AI Module</span>
        <span className={`text-xs font-bold ${
          permissions.moduleEnabled
            ? "text-purple-500"
            : "text-muted-3"
        }`}>
          {permissions.moduleEnabled ? "ON" : "OFF"}
        </span>
      </div>

      {/* Quick Toggle */}
      <button
        onClick={handleQuickToggle}
        disabled={toggling}
        className={`p-1.5 rounded-lg transition-colors ${
          permissions.moduleEnabled
            ? "bg-purple-500 hover:bg-purple-600"
            : "bg-surface-2 hover:bg-surface-3"
        } disabled:opacity-50`}
        title={permissions.moduleEnabled ? "Turn off" : "Turn on"}
      >
        <Power className="w-4 h-4 text-white" />
      </button>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors"
        title="AI Settings"
      >
        <Settings className="w-4 h-4 text-white" />
      </button>
    </div>
  )
}
