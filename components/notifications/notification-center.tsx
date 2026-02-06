'use client'

import { useNotifications } from '@/hooks/use-notifications'
import { useRouter } from 'next/navigation'
import {
  Gift,
  Award,
  Users,
  Radio,
  Video,
  UserPlus,
  MessageCircle,
  Bell
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Notification as NotificationDB } from '@/types/database'
import { Notification as NotificationService } from '@/lib/notifications/service'

/**
 * Notification item type (from service, compatible with database)
 */
type NotificationItem = NotificationService | NotificationDB

interface NotificationCenterProps {
  onClose: () => void
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications()
  const router = useRouter()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tip_received':
        return <Gift className="h-5 w-5 text-green-500" />
      case 'badge_earned':
        return <Award className="h-5 w-5 text-yellow-500" />
      case 'match_found':
        return <Users className="h-5 w-5 text-blue-500" />
      case 'topic_streamed':
        return <Radio className="h-5 w-5 text-purple-500" />
      case 'session_started':
        return <Video className="h-5 w-5 text-indigo-500" />
      case 'presenter_invited':
        return <UserPlus className="h-5 w-5 text-orange-500" />
      case 'message_reply':
        return <MessageCircle className="h-5 w-5 text-pink-500" />
      default:
        return <Bell className="h-5 w-5 text-muted-3" />
    }
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Navigate to link if exists
    if (notification.link) {
      router.push(notification.link)
    }

    // Close the dropdown
    onClose()
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <div className="w-96 bg-white dark:bg-surface-1 rounded-lg shadow-2xl border border-border-default dark:border-border-default overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-default dark:border-border-default">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-3 dark:text-muted-2" />
          <h3 className="font-semibold text-muted-1 dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            aria-label={`Mark all ${unreadCount} notifications as read`}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div
        className="max-h-[500px] overflow-y-auto"
        role="region"
        aria-label="Notifications list"
        aria-live="polite"
      >
        {loading ? (
          <div className="p-8 text-center text-muted-3 dark:text-muted-3" role="status">
            <div className="w-8 h-8 border-4 border-border-default border-t-accent rounded-full animate-spin mx-auto mb-3" aria-hidden="true" />
            <span>Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center" role="status">
            <Bell className="h-12 w-12 text-muted-2 dark:text-muted-4 mx-auto mb-3" aria-hidden="true" />
            <p className="text-muted-3 dark:text-muted-3 font-medium">
              No notifications yet
            </p>
            <p className="text-sm text-muted-3 dark:text-muted-3 mt-1">
              We'll notify you when something happens
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-dim dark:divide-border-default">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full p-4 hover:bg-surface-1 dark:hover:bg-surface-2 transition-colors text-left ${
                  !notification.read
                    ? 'bg-blue-50 dark:bg-blue-900/10'
                    : 'bg-white dark:bg-surface-1'
                }`}
                aria-label={`${notification.title}. ${notification.read ? 'Read' : 'Unread'}. ${notification.message}`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-muted-1 dark:text-white text-sm">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-muted-4 dark:text-muted-3 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-3 dark:text-muted-3 mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-border-default dark:border-border-default bg-surface-1 dark:bg-surface-2">
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-muted-4 dark:text-muted-3 hover:text-muted-1 dark:hover:text-muted-1 font-medium"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
