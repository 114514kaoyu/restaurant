import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Legend, Cell,
  LineChart, Line,
} from 'recharts'
import SnapshotSelector from '../components/SnapshotSelector'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import useStore from '../stores/useStore'
import { fetchCategoryStats, fetchDistrictStats, fetchPriceRating, fetchRatingDistribution } from '../api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#a855f7']

export default function AnalysisPage() {
  const { currentSnapshot } = useStore()
  const [tab, setTab] = useState('category')
  const [loading, setLoading] = useState(false)
  const [categoryData, setCategoryData] = useState([])
  const [districtData, setDistrictData] = useState([])
  const [scatterData, setScatterData] = useState([])
  const [ratingDist, setRatingDist] = useState([])

  useEffect(() => {
    if (currentSnapshot?.id) loadAll()
  }, [currentSnapshot?.id])

  async function loadAll() {
    setLoading(true)
    try {
      const [cats, dists, scatter, dist] = await Promise.all([
        fetchCategoryStats(currentSnapshot.id),
        fetchDistrictStats(currentSnapshot.id),
        fetchPriceRating(currentSnapshot.id),
        fetchRatingDistribution(currentSnapshot.id),
      ])
      setCategoryData(cats.slice(0, 20))
      setDistrictData(dists.slice(0, 20))
      setScatterData(scatter)
      setRatingDist(dist)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (!currentSnapshot) {
    return <div><SnapshotSelector /><EmptyState title="请先选择城市和快照" /></div>
  }

  if (loading) return <><SnapshotSelector /><LoadingSpinner /></>

  const tabs = [
    { key: 'category', label: '菜系分析' },
    { key: 'district', label: '区域分析' },
    { key: 'scatter', label: '价格-评分' },
    { key: 'distribution', label: '评分分布' },
  ]

  return (
    <div className="space-y-4">
      <SnapshotSelector />

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        {tab === 'category' && (
          <>
            <h3 className="mb-4 font-semibold text-gray-700">各菜系餐厅数量 & 平均评分</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={categoryData} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="数量" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="avg_rating" name="平均评分" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {tab === 'district' && (
          <>
            <h3 className="mb-4 font-semibold text-gray-700">各区域餐厅数量 & 平均评分</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={districtData} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="district" angle={-45} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="数量" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="avg_rating" name="平均评分" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {tab === 'scatter' && (
          <>
            <h3 className="mb-4 font-semibold text-gray-700">价格 vs 评分 散点图</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ bottom: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="price" name="人均消费" unit="元" type="number" />
                <YAxis dataKey="rating" name="评分" domain={[1, 5]} />
                <ZAxis dataKey="rating_count" name="评价数" range={[20, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                  if (!payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="rounded-lg bg-white p-3 shadow-lg border text-xs">
                      <p className="font-bold text-gray-800">{d.name}</p>
                      <p>人均: ¥{d.price} · 评分: {d.rating} · 评价: {d.rating_count}</p>
                      <p className="text-gray-400">{d.category}</p>
                    </div>
                  )
                }} />
                <Scatter data={scatterData} fill="#3b82f6" fillOpacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </>
        )}

        {tab === 'distribution' && (
          <>
            <h3 className="mb-4 font-semibold text-gray-700">评分分布直方图</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={ratingDist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="餐厅数量" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {ratingDist.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  )
}