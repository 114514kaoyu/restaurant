import React, { useEffect, useState } from 'react'
import { Search, Filter, Star, MapPin } from 'lucide-react'
import SnapshotSelector from '../components/SnapshotSelector'
import Pagination from '../components/Pagination'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import useStore from '../stores/useStore'
import { fetchRestaurants, fetchCategories, fetchDistricts } from '../api'

export default function RestaurantList() {
  const { currentSnapshot } = useStore()
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 })
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [districts, setDistricts] = useState([])

  const [filters, setFilters] = useState({
    category: '', district: '', keyword: '', min_rating: '', max_price: '', page: 1,
  })

  useEffect(() => {
    if (currentSnapshot?.id) {
      loadFilters()
      loadData(1)
    }
  }, [currentSnapshot?.id])

  async function loadFilters() {
    try {
      const [cats, dists] = await Promise.all([
        fetchCategories(currentSnapshot.id),
        fetchDistricts(currentSnapshot.id),
      ])
      setCategories(cats)
      setDistricts(dists)
    } catch (e) { console.error(e) }
  }

  async function loadData(page = 1) {
    setLoading(true)
    try {
      const params = {
        snapshot_id: currentSnapshot.id,
        page,
        page_size: 20,
        sort_by: 'rating',
        sort_order: 'desc',
      }
      if (filters.category) params.category = filters.category
      if (filters.district) params.district = filters.district
      if (filters.keyword) params.keyword = filters.keyword
      if (filters.min_rating) params.min_rating = Number(filters.min_rating)
      if (filters.max_price) params.max_price = Number(filters.max_price)

      const res = await fetchRestaurants(params)
      setData(res)
      setFilters((f) => ({ ...f, page }))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function handleSearch() { loadData(1) }

  if (!currentSnapshot) {
    return <div><SnapshotSelector /><EmptyState title="请先选择城市和快照" /></div>
  }

  return (
    <div className="space-y-4">
      <SnapshotSelector />

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs text-gray-500">菜系</label>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none">
            <option value="">全部菜系</option>
            {categories.map((c) => <option key={c.category} value={c.category}>{c.category} ({c.count})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">区域</label>
          <select value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none">
            <option value="">全部区域</option>
            {districts.map((d) => <option key={d.district} value={d.district}>{d.district} ({d.count})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">最低评分</label>
          <input type="number" step="0.5" min="0" max="5" value={filters.min_rating} onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })} className="w-24 rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="0" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">最高人均</label>
          <input type="number" step="10" min="0" value={filters.max_price} onChange={(e) => setFilters({ ...filters, max_price: e.target.value })} className="w-24 rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="不限" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">关键词</label>
          <input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-40 rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="搜索餐厅名..." />
        </div>
        <button onClick={handleSearch} className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700">
          <Search className="h-4 w-4" /> 查询
        </button>
      </div>

      {/* 结果 */}
      {loading ? (
        <LoadingSpinner />
      ) : data.items.length === 0 ? (
        <EmptyState title="没有符合条件的餐厅" description="尝试调整筛选条件" />
      ) : (
        <>
          <p className="text-sm text-gray-500">共找到 {data.total} 家餐厅</p>
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">名称</th>
                  <th className="px-4 py-3">菜系</th>
                  <th className="px-4 py-3">评分</th>
                  <th className="px-4 py-3">评价数</th>
                  <th className="px-4 py-3">人均</th>
                  <th className="px-4 py-3">区域</th>
                  <th className="px-4 py-3">地址</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{(data.page - 1) * data.page_size + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.category || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-3.5 w-3.5 fill-yellow-400" />
                        {r.rating ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.rating_count}</td>
                    <td className="px-4 py-3 text-gray-600">{r.cost_avg ? `¥${r.cost_avg}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{r.district || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 truncate max-w-xs">{r.address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.total_pages} onChange={(p) => loadData(p)} />
        </>
      )}
    </div>
  )
}