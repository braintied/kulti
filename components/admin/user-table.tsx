'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import type { UserRole } from '@/lib/admin/permissions'

interface User {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  role: UserRole
  credits_balance: number
  total_credits_earned: number
  created_at: string
  is_approved: boolean
}

interface UserTableProps {
  users: User[]
  onAction: (_userId: string, _action: string) => void
  loading?: boolean
}

export function UserTable({ users, onAction, loading = false }: UserTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUsers(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)))
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border-default bg-surface-1">
        <div className="animate-pulse p-8 text-center text-muted-3">
          Loading users...
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-border-default bg-surface-1 p-8 text-center text-muted-3">
        No users found
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-default bg-surface-1">
      <table className="w-full">
        <thead className="border-b border-border-default bg-surface-2/50">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedUsers.size === users.length}
                onChange={toggleSelectAll}
                className="rounded border-border-default bg-surface-2 text-purple-600 focus:ring-accent"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-3">
              User
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-3">
              Username
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-3">
              Role
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-3">
              Credits
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-3">
              Joined
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-3">
              Status
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-3">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {users.map((user) => (
            <tr
              key={user.id}
              className="transition-colors hover:bg-surface-2/30"
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                  className="rounded border-border-default bg-surface-2 text-purple-600 focus:ring-accent"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.display_name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
                      {user.display_name[0].toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-white">
                    {user.display_name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-3">
                @{user.username}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`
                    inline-flex rounded-full px-2 py-1 text-xs font-medium
                    ${
                      user.role === 'admin'
                        ? 'bg-purple-500/10 text-purple-500'
                        : user.role === 'moderator'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-surface-3 text-muted-3'
                    }
                  `}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm">
                  <div className="font-medium text-white">
                    {user.credits_balance.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-3">
                    {user.total_credits_earned.toLocaleString()} earned
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-3">
                {formatDistanceToNow(new Date(user.created_at), {
                  addSuffix: true,
                })}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`
                    inline-flex rounded-full px-2 py-1 text-xs font-medium
                    ${
                      user.is_approved
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }
                  `}
                >
                  {user.is_approved ? 'Approved' : 'Pending'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onAction(user.id, 'view')}
                    className="rounded px-3 py-1 text-sm font-medium text-purple-400 hover:bg-purple-500/10"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onAction(user.id, 'edit')}
                    className="rounded px-3 py-1 text-sm font-medium text-blue-400 hover:bg-blue-500/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onAction(user.id, 'delete')}
                    className="rounded px-3 py-1 text-sm font-medium text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
