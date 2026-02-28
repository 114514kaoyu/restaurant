import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, MapPin, RefreshCw } from 'lucide-react'
import { fetchCities, createCity, deleteCity } from '../api'
import useStore from '../stores/useStore'
import ConfirmDialog from '../components/ConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'

const PRESET_CITIES = [
  { name: '成都', province: '四川', center_lat: 30.572, center_lng: 104.066, radius_km: 15 },
  { name: '北京', province: '北京', center_lat: 39.904, center_lng: 116.407, radius_km: 20 },
  { name: '上海', province: '上海', center_lat: 31.230, center_lng: 121.474, radius_km: 18 },
  { name: '广州', province: '广东', center_lat: 23.129, center_lng: 113.264, radius_km: 15 },
  { name: '深圳', province: '广东', center_lat: 22.543, center_lng: 114.058, radius_km: 15 },
  { name: '杭州', province: '浙江', center_lat: 30.274, center_lng: 120.155, radius_km: 15 },
  { name: '重庆', province: '重庆', center_lat: 29.563, center_lng: 106.551, radius_km: 15 },
  { name: '西安', province: '陕西', center_lat: 34.264, center_lng: 108.943, radius_km: 12 },
  { name: '武汉', province: '湖北', center_lat: 30.593, center_lng: 114.305, radius_km: 15 },
  { name: '长沙', province: '湖南', center_lat: 28.228, center_lng: 112.939, radius_km: 12 },
]

export default function CityManage() {
  const { cities, setCities, showToast } = useStore()
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', province: '', center_lat: '', center_lng: '', radius_km: 15 })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadCities() }, [])

  async function loadCities() {
    setLoading(true)
    try {
      const data = await fetchCities()
      setCities(data)
    } catch (e) {
      showToast(e.message, 'error')
    }
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.name || !form.center_lat || !form.center_lng) {
      showToast('请填写完整信息', 'warning')
      return
    }
    setSubmitting(true)
    try {
      await createCity({
        name: form.name,
        province: form.province || null,
        center_lat: Number(form.center_lat),
        center_lng: Number(form.center_lng),
        radius_km: Number(form.radius_km) || 15,
      })
      showToast(`城市「${form.name}」已添加`, 'success')
      setForm({ name: '', province: '', center_lat: '', center_lng: '', radius_km: 15 })
      setShowForm(false)
      loadCities()
    } catch (e) {
      showToast(e.message, 'error')
    }
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteCity(deleteTarget.id)
      showToast(`城市「${deleteTarget.name}」已删除`, 'success')
      loadCities()
    } catch (e) {
      showToast(e.message, 'error')
    }
    setDeleteTarget(null)
  }

  function usePreset(preset) {
    setForm({
      name: preset.name,
      province: preset.province,
      center_lat: String(preset.center_lat),
      center_lng: String(preset.center_lng),
      radius_km: preset.radius_km,
    })
    setShowForm(true)
  }

  if (loading) return <LoadingSpinner text="加载城市列表..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">城市管理</h2>
        <div className="flex gap-2">
          <button onClick={loadCities} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> 刷新
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700">
            <Plus className="h-4 w-4" /> 添加城市
          </button>
        </div>
      </div>

      {/* 添加表单 */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border bg-white shadow-sm"
          >
            <div className="p-5">
              <h3 className="mb-4 font-semibold text-gray-700">添加新城市</h3>

              {/* 预设城市快捷按钮 */}
              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-500">快捷选择:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CITIES.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => usePreset(p)}
                      className="rounded-full border px-3 py-1 text-xs text-gray-600 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">城市名称 *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="如: 成都" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">省份</label>
                  <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="如: 四川" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">中心纬度 *</label>
                  <input type="number" step="0.001" value={form.center_lat} onChange={(e) => setForm({ ...form, center_lat: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="30.572" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">中心经度 *</label>
                  <input type="number" step="0.001" value={form.center_lng} onChange={(e) => setForm({ ...form, center_lng: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="104.066" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">搜索半径 (km)</label>
                  <input type="number" step="1" value={form.radius_km} onChange={(e) => setForm({ ...form, radius_km: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="15" />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={handleCreate} disabled={submitting} className="rounded-lg bg-primary-600 px-6 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50">
                  {submitting ? '添加中...' : '确认添加'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 城市列表 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cities.map((city) => (
          <motion.div
            key={city.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-50 p-2">
                  <MapPin className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{city.name}</h3>
                  <p className="text-xs text-gray-400">{city.province || '—'}</p>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(city)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-gray-500">
              <span>纬度: {city.center_lat}</span>
              <span>经度: {city.center_lng}</span>
              <span>半径: {city.radius_km} km</span>
              <span>快照: {city.snapshot_count} 个</span>
            </div>

            {city.latest_snapshot && (
              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                最新快照: #{city.latest_snapshot.id}　·　
                {city.latest_snapshot.total_count} 家餐厅　·　
                <span className={city.latest_snapshot.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
                  {city.latest_snapshot.status === 'completed' ? '已完成' : city.latest_snapshot.status}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {cities.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          尚未添加任何城市，点击上方「添加城市」开始
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="删除城市"
        message={`确定删除「${deleteTarget?.name}」及其所有采集数据？此操作不可恢复。`}
      />
    </div>
  )
}