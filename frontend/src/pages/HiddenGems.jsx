import React, { useEffect, useState } from 'react'
import { Gem, Star, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import SnapshotSelector from '../components/SnapshotSelector'
import AlgorithmSelect from '../components/AlgorithmSelect'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import useStore from '../stores/useStore'
import { fetchHiddenGems } from '../api'

export default function HiddenGems() {
  const { currentSnapshot, currentAlgorithm } = useStore()
  const [gems, setGems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentSnapshot?.id) loadGems()
  }, [currentSnapshot?.id, currentAlgorithm])

  async function loadGems() {
    setLoading(true)
    try {
      const res = await fetchHiddenGems({
        snapshot_id: currentSnapshot.id,
        algorithm: currentAlgorithm,
        top_n: 50,
      })
      setGems(res)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (!currentSnapshot) {
    return <div><SnapshotSelector /><EmptyState title="请先选择城市和快照" /></div>
  }

  return (
    <div className="space-y-4">
      <SnapshotSelector />
      <div className="flex items-center gap-3">
        <AlgorithmSelect />
        <span className="text-sm text-gray-400">排名靠前、但评价量少的宝藏餐厅</span>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : gems.length === 0 ? (
        <EmptyState icon={Gem} title="未发现隐藏宝藏" description="请先计算排名后再查看" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {gems.map((g, idx) => (
            <motion.div
              key={g.restaurant_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Gem className="h-4 w-4 text-purple-500" />
                    <h4 className="font-semibold text-gray-800">{g.name}</h4>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{g.category || '—'}</p>
                </div>
                <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                  #{g.rank}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" /> {g.rating}
                </span>
                <span>{g.rating_count} 条评价</span>
                {g.cost_avg && <span>¥{g.cost_avg}/人</span>}
              </div>

              {g.district && (
                <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" /> {g.district}
                </p>
              )}

              <p className="mt-3 rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-700">
                {g.reason}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}