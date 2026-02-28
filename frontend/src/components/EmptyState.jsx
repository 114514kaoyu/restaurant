import React from 'react'
import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = '暂无数据',
  description = '请先完成数据采集',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-16 w-16 text-gray-300" strokeWidth={1} />
      <h3 className="mt-4 text-lg font-medium text-gray-600">{title}</h3>
      <p className="mt-1 text-sm text-gray-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}