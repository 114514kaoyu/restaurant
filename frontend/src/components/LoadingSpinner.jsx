import React from 'react'
import { motion } from 'framer-motion'

export default function LoadingSpinner({ text = '加载中...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-primary-500"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      />
      <p className="mt-4 text-sm text-gray-500">{text}</p>
    </div>
  )
}