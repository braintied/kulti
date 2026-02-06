'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

/**
 * Invite metadata interface
 */
interface InviteMetadata {
  note?: string
  [key: string]: unknown
}

/**
 * Create Invite Modal Props interface
 */
interface CreateInviteModalProps {
  onClose: () => void
  onCreate: (params: {
    maxUses: number
    expiresAt: string | null
    metadata: InviteMetadata
  }) => Promise<void>
}

export function CreateInviteModal({ onClose, onCreate }: CreateInviteModalProps) {
  const [maxUses, setMaxUses] = useState(1)
  const [expiresAt, setExpiresAt] = useState('')
  const [note, setNote] = useState('')
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      await onCreate({
        maxUses,
        expiresAt: expiresAt || null,
        metadata: note ? { note } : {},
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="create-invite-title">
      <div className="w-full max-w-md rounded-lg border border-border-default bg-surface-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="create-invite-title" className="text-xl font-semibold text-white">
            Create Invite Code
          </h2>
          <button
            onClick={onClose}
            className="text-muted-3 hover:text-muted-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close create invite modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-2 mb-2">
              Max Uses
            </label>
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value))}
              className="w-full rounded-lg border border-border-default bg-surface-2 px-4 py-2 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
            <p className="mt-1 text-xs text-muted-3">
              How many times this code can be used
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-2 mb-2">
              Expires At (Optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-surface-2 px-4 py-2 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1 text-xs text-muted-3">
              Leave empty for no expiration
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-2 mb-2">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., For beta testers"
              className="w-full rounded-lg border border-border-default bg-surface-2 px-4 py-2 text-white placeholder-muted-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-2 hover:bg-surface-2 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50 transition-colors min-h-[44px]"
            >
              {creating ? 'Creating...' : 'Create Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
