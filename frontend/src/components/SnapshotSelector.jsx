import React, { useEffect, useState } from 'react'
import { fetchCities } from '../api'
import useStore from '../stores/useStore'
import { ChevronDown } from 'lucide-react'

export default function SnapshotSelector() {
  const {
    cities,
    setCities,
    currentCity,
    setCurrentCity,
    currentSnapshot,
    setCurrentSnapshot,
  } = useStore()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCities()
  }, [])

  async function loadCities() {
    setLoading(true)
    try {
      const data = await fetchCities()
      setCities(data)
      if (!currentCity && data.length > 0) {
        setCurrentCity(data[0])
        if (data[0].latest_snapshot) {
          setCurrentSnapshot(data[0].latest_snapshot)
        }
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function handleCityChange(e) {
    const city = cities.find((c) => c.id === Number(e.target.value))
    if (city) {
      setCurrentCity(city)
      setCurrentSnapshot(city.latest_snapshot || null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">城市:</label>
        <div className="relative">
          <select
            value={currentCity?.id || ''}
            onChange={handleCityChange}
            disabled={loading}
            className="appearance-none rounded-lg border bg-gray-50 py-1.5 pl-3 pr-8 text-sm text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">请选择城市</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.snapshot_count}个快照)
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {currentSnapshot && (
        <div className="text-sm text-gray-500">
          快照 #{currentSnapshot.id}　·　{currentSnapshot.total_count} 家餐厅　·　
          <span
            className={`font-medium ${
              currentSnapshot.status === 'completed'
                ? 'text-green-600'
                : currentSnapshot.status === 'collecting'
                ? 'text-yellow-600'
                : 'text-gray-500'
            }`}
          >
            {currentSnapshot.status === 'completed'
              ? '已完成'
              : currentSnapshot.status === 'collecting'
              ? '采集中'
              : currentSnapshot.status}
          </span>
        </div>
      )}
    </div>
  )
}