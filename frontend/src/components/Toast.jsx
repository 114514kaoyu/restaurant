import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import useStore from '../stores/useStore'

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
}

export default function Toast() {
  const toast = useStore((s) => s.toast)

  return (
    <div className="fixed right-4 top-4 z-50">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${
              colorMap[toast.type] || colorMap.info
            }`}
          >
            {React.createElement(iconMap[toast.type] || Info, {
              className: 'h-5 w-5 flex-shrink-0',
            })}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}