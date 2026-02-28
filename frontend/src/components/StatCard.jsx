import React from 'react'
import { motion } from 'framer-motion'

export default function StatCard({ icon: Icon, label, value, color = 'blue', sub }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    pink: 'bg-pink-50 text-pink-600',
    teal: 'bg-teal-50 text-teal-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-2.5 ${colorClasses[color] || colorClasses.blue}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </motion.div>
  )
}