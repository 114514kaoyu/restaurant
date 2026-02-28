import React, { useEffect, useState } from 'react'
import { GitCompare, Calculator, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import SnapshotSelector from '../components/SnapshotSelector'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import useStore from '../stores/useStore'
import { compareAlgorithms, calculateRanking } from '../api'

const ALGO_COLORS = {
  naive: '#ef4444',
  bayesian: '#f59e0b',
  wilson: '#3b82f6',
  weighted: '#10b981',
}

const ALGO_LABELS = {
  naive: '朴素排序',
  bayesian: '贝叶斯',
  wilson: 'Wilson',
  weighted: '加权综合',
}

export default function AlgorithmCompare() {
  const { currentSnapshot, showToast } = useStore()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [calcAll, setCalcAll] = useState(false)
  const [topN, setTopN] = useState(20)

  useEffect(() => {
    if (currentSnapshot?.id) loadData()
  }, [currentSnapshot?.id, topN])

  async function loadData() {
    setLoading(true)
    try {
      const res = await compareAlgorithms(currentSnapshot.id, topN)
      setData(res)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleCalcAll() {
    if (!currentSnapshot?.id) return
    setCalcAll(true)
    try {
      for (const algo of ['naive', 'bayesian', 'wilson', 'weighted']) {
        await calculateRanking({ snapshot_id: currentSnapshot.id, algorithm: algo, confidence: 0.99 })
      }
      showToast('四种算法均已计算完成', 'success')
      loadData()
    } catch (e) { showToast(e.message, 'error') }
    setCalcAll(false)
  }

  // 构建图表数据
  const chartData = data.slice(0, 15).map((item) => {
    const row = { name: item.restaurant_name.slice(0, 8) }
    for (const algo of ['naive', 'bayesian', 'wilson', 'weighted']) {
      row[algo] = item.rankings[algo]?.rank ?? null
    }
    return row
  })

  if (!currentSnapshot) {
    return <div><SnapshotSelector /><EmptyState title="请先选择城市和快照" /></div>
  }

  return (
    <div className="space-y-6">
      <SnapshotSelector />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Top N:</label>
          <input type="number" min="5" max="100" value={topN} onChange={(e) => setTopN(Number(e.target.value))} className="w-20 rounded-lg border px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none" />
        </div>
        <button onClick={handleCalcAll} disabled={calcAll} className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50">
          {calcAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          {calcAll ? '计算中...' : '计算全部四种算法'}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : data.length === 0 ? (
        <EmptyState icon={GitCompare} title="暂无对比数据" description="请先计算全部四种算法" />
      ) : (
        <>
          {/* 排名对比图 */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-700">排名对比图 (名次越低越好)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" reversed domain={[1, topN]} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {Object.keys(ALGO_COLORS).map((algo) => (
                  <Bar key={algo} dataKey={algo} name={ALGO_LABELS[algo]} fill={ALGO_COLORS[algo]} barSize={8} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 表格 */}
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">餐厅</th>
                  {Object.entries(ALGO_LABELS).map(([key, label]) => (
                    <th key={key} className="px-4 py-3 text-center">{label}<br /><span className="font-normal">排名 / 分数</span></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((item) => (
                  <tr key={item.restaurant_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.restaurant_name}</td>
                    {['naive', 'bayesian', 'wilson', 'weighted'].map((algo) => (
                      <td key={algo} className="px-4 py-3 text-center text-gray-600">
                        {item.rankings[algo]
                          ? <span>#{item.rankings[algo].rank} <span className="text-xs text-gray-400">({item.rankings[algo].score})</span></span>
                          : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}