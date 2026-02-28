import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UtensilsCrossed, MapPin, Star, DollarSign,
  BarChart3, Users, Layers, TrendingUp,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import StatCard from '../components/StatCard'
import SnapshotSelector from '../components/SnapshotSelector'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import useStore from '../stores/useStore'
import { fetchOverview, fetchCategoryStats, fetchRatingDistribution } from '../api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

export default function Dashboard() {
  const { currentSnapshot } = useStore()
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [ratingDist, setRatingDist] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentSnapshot?.id) loadData()
  }, [currentSnapshot?.id])

  async function loadData() {
    setLoading(true)
    try {
      const [ov, cats, dist] = await Promise.all([
        fetchOverview(currentSnapshot.id),
        fetchCategoryStats(currentSnapshot.id),
        fetchRatingDistribution(currentSnapshot.id),
      ])
      setOverview(ov)
      setCategoryData(cats.slice(0, 10))
      setRatingDist(dist)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (!currentSnapshot) {
    return (
      <div>
        <SnapshotSelector />
        <EmptyState
          title="欢迎使用餐厅排名系统"
          description="请先在「城市管理」中添加城市并完成数据采集"
          action={
            <button
              onClick={() => navigate('/cities')}
              className="rounded-lg bg-primary-600 px-5 py-2 text-sm text-white hover:bg-primary-700"
            >
              前往城市管理
            </button>
          }
        />
      </div>
    )
  }

  if (loading) return <LoadingSpinner text="加载仪表盘..." />

  return (
    <div className="space-y-6">
      <SnapshotSelector />

      {/* 统计卡片 */}
      {overview && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={UtensilsCrossed} label="餐厅总数" value={overview.total} color="blue" />
          <StatCard icon={Star} label="平均评分" value={overview.avg_rating} color="green" sub={`中位数 ${overview.median_rating}`} />
          <StatCard icon={DollarSign} label="平均人均" value={`¥${overview.avg_price}`} color="orange" />
          <StatCard icon={Users} label="平均评价数" value={overview.avg_reviews} color="purple" />
          <StatCard icon={Layers} label="菜系数量" value={overview.total_categories} color="indigo" />
          <StatCard icon={MapPin} label="区域数量" value={overview.total_districts} color="teal" />
          <StatCard icon={TrendingUp} label="最高评分" value={overview.max_rating} color="pink" />
          <StatCard icon={BarChart3} label="最低评分" value={overview.min_rating} color="red" />
        </div>
      )}

      {/* 图表区 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 评分分布 */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-gray-700">评分分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ratingDist}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="数量" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 菜系 Top10 饼图 */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-gray-700">菜系 Top10</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ category, percent }) =>
                  `${category} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={true}
              >
                {categoryData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}