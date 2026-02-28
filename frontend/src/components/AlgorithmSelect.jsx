import React from 'react'
import useStore from '../stores/useStore'
import { ChevronDown } from 'lucide-react'

const algorithms = [
  { value: 'naive', label: '朴素排序' },
  { value: 'bayesian', label: '贝叶斯平均' },
  { value: 'wilson', label: 'Wilson评分' },
  { value: 'weighted', label: '加权综合' },
]

export default function AlgorithmSelect({ value, onChange }) {
  const store = useStore()
  const current = value ?? store.currentAlgorithm
  const handleChange = onChange ?? ((v) => store.setCurrentAlgorithm(v))

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-600">算法:</label>
      <div className="relative">
        <select
          value={current}
          onChange={(e) => handleChange(e.target.value)}
          className="appearance-none rounded-lg border bg-gray-50 py-1.5 pl-3 pr-8 text-sm text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {algorithms.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  )
}