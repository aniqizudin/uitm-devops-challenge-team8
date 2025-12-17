'use client'

import { Bell } from 'lucide-react'

interface NotificationsBadgeProps {
  className?: string
}

function NotificationsBadge({ className = '' }: Readonly<NotificationsBadgeProps>) {
  // Always return null to avoid misleading users about pending agreements
  return null
}

export default NotificationsBadge