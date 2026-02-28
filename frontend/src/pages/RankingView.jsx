import React, { useEffect, useState } from 'react'
import { Trophy, Calculator, Download, Star } from 'lucide-react'
import SnapshotSelector from '../components/SnapshotSelector'
import AlgorithmSelect from '../components/AlgorithmSelect'
import Pagination from '../components/Pagination'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import useStore from '../stores/useStore'
import { calculateRanking, fetchRankingList, getExcelDownloadUrl } from '../api'

export default function RankingView() {
  const { currentSnapshot, currentAlgorithm, showToast } = useStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (currentSnapshot?.id) loadRanking(1)
  }, [currentSnapshot?.id, currentAlgorithm])

  async function loadRanking(p = 1) {
    setLoading(true)
    try {
      const res = await fetchRankingList({
        snapshot_id: currentSnapshot.id,
        algorithm: currentAlgorithm,
        page: p,
        page_size: 20,
      })
      setData(res)
      setPage(p)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleCalculate() {
    if (!currentSnapshot?.id) return
    setCalculating(true)
    try {
      const res = await calculateRanking({
        snapshot_id: currentSnapshot.id,
        algorithm: currentAlgorithm,
        confidence: 0.99,
      })
      showToast(res.message, 'success')
      loadRanking(1)
    } catch (e) {
      showToast(e.message, 'error')
    }
    setCalculating(false)
  }

  function handleExport() {
    if (!currentSnapshot?.id) return
    window.open(getExcelDownloadUrl(currentSnapshot.id, currentAlgorithm), '_blank')
  }

  if (!currentSnapshot) {
    return <div><SnapshotSelector /><EmptyState title="请先选择城市和快照" /></div>
  }

  const rankMedal = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank
  }

  return (
    <div className="space-y-4">
      <SnapshotSelector />

      <div className="flex flex-wrap items-center gap-3">
        <AlgorithmSelect />
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <Calculator className="h-4 w-4" />
          {calculating ? '计算中...' : '计算排名'}
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" /> 导出Excel
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="暂无排名数据"
          description="请先点击「计算排名」按钮生成排名"
        />
      ) : (
        <>
          <p className="text-sm text-gray-500">共 {data.total} 家餐厅参与排名</p>
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 w-16">排名</th>
                  <th className="px-4 py-3">名称</th>
                  <th className="px-4 py-3">菜系</th>
                  <th className="px-4 py-3">评分</th>
                  <th className="px-4 py-3">评价数</th>
                  <th className="px-4 py-3">人均</th>
                  <th className="px-4 py-3">区域</th>
                  <th className="px-4 py-3">算法得分</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.rank <= 3 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 text-center text-lg">{rankMedal(item.rank)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.category || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-3.5 w-3.5 fill-yellow-400" /> {item.rating ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.rating_count}</td>
                    <td className="px-4 py-3 text-gray-600">{item.cost_avg ? `¥${item.cost_avg}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{item.district || '—'}</td>
                    <td className="px-4 py-3 font-mono text-primary-700 font-semibold">{item.score?.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data.total_pages} onChange={(p) => loadRanking(p)} />
        </>
      )}
    </div>
  )
}