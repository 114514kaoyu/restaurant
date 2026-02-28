import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import SnapshotSelector from '../components/SnapshotSelector'
import AlgorithmSelect from '../components/AlgorithmSelect'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import useStore from '../stores/useStore'
import { fetchHeatmapData } from '../api'

function scoreToColor(score, max) {
  const ratio = max > 0 ? score / max : 0
  if (ratio > 0.8) return '#ef4444'
  if (ratio > 0.6) return '#f97316'
  if (ratio > 0.4) return '#eab308'
  if (ratio > 0.2) return '#22c55e'
  return '#3b82f6'
}

export default function HeatmapPage() {
  const { currentSnapshot, currentCity, currentAlgorithm } = useStore()
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [topPercent, setTopPercent] = useState(100)

  useEffect(() => {
    if (currentSnapshot?.id) loadData()
  }, [currentSnapshot?.id, currentAlgorithm, topPercent])

  async function loadData() {
    setLoading(true)
    try {
      const data = await fetchHeatmapData(currentSnapshot.id, currentAlgorithm, topPercent)
      setPoints(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (!currentSnapshot) {
    return <div><SnapshotSelector /><EmptyState title="请先选择城市和快照" /></div>
  }

  const center = currentCity
    ? [currentCity.center_lat, currentCity.center_lng]
    : [30.57, 104.07]

  const maxWeight = points.length > 0
    ? Math.max(...points.map((p) => p.weight || 0))
    : 5

  return (
    <div className="space-y-4">
      <SnapshotSelector />

      <div className="flex flex-wrap items-center gap-4">
        <AlgorithmSelect />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Top%:</label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={topPercent}
            onChange={(e) => setTopPercent(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm font-medium text-gray-800">{topPercent}%</span>
        </div>
        <span className="text-sm text-gray-400">共 {points.length} 个数据点</span>
      </div>

      {loading ? (
        <LoadingSpinner text="加载地图数据..." />
      ) : (
        <div className="h-96 overflow-hidden rounded-xl border shadow-sm md:h-screen md:max-h-screen">
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map((p, idx) => (
              <CircleMarker
                key={idx}
                center={[p.lat, p.lng]}
                radius={6}
                fillColor={scoreToColor(p.weight, maxWeight)}
                fillOpacity={0.7}
                stroke={false}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold">{p.name}</p>
                    <p>得分: {p.weight?.toFixed(2)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* 图例 */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>图例:</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-red-500" /> 极高</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-orange-500" /> 高</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-yellow-500" /> 中</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-green-500" /> 低</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-blue-500" /> 较低</span>
      </div>
    </div>
  )
}