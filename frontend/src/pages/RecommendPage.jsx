import React, { useEffect, useState } from 'react'
import { ThumbsUp, Star, MapPin, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import SnapshotSelector from '../components/SnapshotSelector'
import AlgorithmSelect from '../components/AlgorithmSelect'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import useStore from '../stores/useStore'
import { fetchRecommendations, fetchCategories } from '../api'

export default function RecommendPage() {
  const { currentSnapshot, currentAlgorithm } = useStore()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({ categories: '', max_price: '', top_n: 20 })

  useEffect(() => {
    if (currentSnapshot?.id) {
      fetchCategories(currentSnapshot.id).then(setCategories).catch(console.error)
    }
  }, [currentSnapshot?.id])

  async function handleSearch() {
    if (!currentSnapshot?.id) return
    setLoading(true)
    try {
      const params = {
        snapshot_id: currentSnapshot.id,
        algorithm: currentAlgorithm,
        top_n: filters.top_n,
      }
      if (filters.categories) params.categories = filters.categories
      if (filters.max_price) params.max_price = Number(filters.max_price)
      const res = await fetchRecommendations(params)
      setResults(res)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (!currentSnapshot) {
    return <div><SnapshotSelector /><EmptyState title="请先选择城市和快照" /></div>
  }

  return (
    <div className="space-y-4">
      <SnapshotSelector />

      {/* 筛选条件 */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <AlgorithmSelect />
        <div>
          <label className="mb-1 block text-xs text-gray-500">偏好菜系 (逗号分隔)</label>
          <input
            value={filters.categories}
            onChange={(e) => setFilters({ ...filters, categories: e.target.value })}
            className="w-48 rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            placeholder="如: 火锅店,川菜"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">预算上限</label>
          <input
            type="number"
            value={filters.max_price}
            onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
            className="w-28 rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            placeholder="不限"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">推荐数量</label>
          <input
            type="number"
            min="5"
            max="100"
            value={filters.top_n}
            onChange={(e) => setFilters({ ...filters, top_n: Number(e.target.value) })}
            className="w-20 rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-1 rounded-lg bg-primary-600 px-5 py-2 text-sm text-white hover:bg-primary-700"
        >
          <Search className="h-4 w-4" /> 获取推荐
        </button>
      </div>

      {/* 热门菜系标签 */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 15).map((c) => (
            <button
              key={c.category}
              onClick={() => setFilters({ ...filters, categories: c.category })}
              className="rounded-full border px-3 py-1 text-xs text-gray-500 hover:border-primary-400 hover:text-primary-600"
            >
              {c.category} ({c.count})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : results.length === 0 ? (
        <EmptyState icon={ThumbsUp} title="暂无推荐结果" description="请设置筛选条件后点击「获取推荐」" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((r, idx) => (
            <motion.div
              key={r.restaurant_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-gray-800">{r.name}</h4>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  #{r.rank}
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-400">{r.category || '—'}</p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" /> {r.rating}
                </span>
                <span>{r.rating_count} 评价</span>
                {r.cost_avg && <span>¥{r.cost_avg}/人</span>}
                <span className="text-primary-600 font-mono text-xs">{r.score?.toFixed(4)}</span>
              </div>

              {r.address && (
                <p className="mt-2 flex items-center gap-1 text-xs text-gray-400 truncate">
                  <MapPin className="h-3 w-3 flex-shrink-0" /> {r.address}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}