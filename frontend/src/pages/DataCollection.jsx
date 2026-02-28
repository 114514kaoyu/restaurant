import React, { useState, useCallback } from 'react'
import { Play, Loader2, Sparkles, CheckCircle, XCircle } from 'lucide-react'
import SnapshotSelector from '../components/SnapshotSelector'
import useStore from '../stores/useStore'
import usePolling from '../hooks/usePolling'
import { startCollection, getCollectionStatus, cleanData } from '../api'

export default function DataCollection() {
  const { currentCity, currentSnapshot, setCurrentSnapshot, showToast } = useStore()
  const [stepKm, setStepKm] = useState(1.0)
  const [collecting, setCollecting] = useState(false)
  const [activeSnapshotId, setActiveSnapshotId] = useState(null)
  const [progress, setProgress] = useState(null)
  const [cleanReport, setCleanReport] = useState(null)
  const [cleaning, setCleaning] = useState(false)

  // 轮询采集状态
  const pollEnabled = collecting && activeSnapshotId
  const pollCallback = useCallback(async () => {
    if (!activeSnapshotId) return
    try {
      const res = await getCollectionStatus(activeSnapshotId)
      setProgress(res.progress)
      if (res.status === 'completed' || res.status === 'failed') {
        setCollecting(false)
        setCurrentSnapshot({ id: activeSnapshotId, total_count: res.total_count, status: res.status })
        if (res.status === 'completed') {
          showToast(`采集完成! 共 ${res.total_count} 家餐厅`, 'success')
        } else {
          showToast('采集失败，请查看日志', 'error')
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [activeSnapshotId])

  usePolling(pollCallback, 2000, pollEnabled)

  async function handleStart() {
    if (!currentCity) {
      showToast('请先选择城市', 'warning')
      return
    }
    setCollecting(true)
    setProgress(null)
    setCleanReport(null)
    try {
      const res = await startCollection(currentCity.id, stepKm)
      setActiveSnapshotId(res.snapshot_id)
      showToast(res.message, 'info')
    } catch (e) {
      setCollecting(false)
      showToast(e.message, 'error')
    }
  }

  async function handleClean() {
    const sid = activeSnapshotId || currentSnapshot?.id
    if (!sid) {
      showToast('没有可清洗的快照', 'warning')
      return
    }
    setCleaning(true)
    try {
      const report = await cleanData(sid)
      setCleanReport(report)
      showToast(`清洗完成! 移除 ${report.total_removed} 条`, 'success')
    } catch (e) {
      showToast(e.message, 'error')
    }
    setCleaning(false)
  }

  const completedPct =
    progress && progress.total_grids > 0
      ? Math.round((progress.completed_grids / progress.total_grids) * 100)
      : 0

  return (
    <div className="space-y-6">
      <SnapshotSelector />

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">数据采集</h2>

        {/* 参数 */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="mb-1 block text-xs text-gray-500">网格步长 (km)</label>
            <input
              type="number"
              step="0.1"
              min="0.3"
              max="5"
              value={stepKm}
              onChange={(e) => setStepKm(Number(e.target.value))}
              disabled={collecting}
              className="w-28 rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleStart}
            disabled={collecting || !currentCity}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {collecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {collecting ? '采集中...' : '开始采集'}
          </button>
        </div>

        {/* 进度条 */}
        {progress && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
              <span>{progress.message}</span>
              <span className="font-semibold">{completedPct}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-500"
                style={{ width: `${completedPct}%` }}
              />
            </div>
            <div className="mt-2 flex gap-6 text-xs text-gray-400">
              <span>网格: {progress.completed_grids}/{progress.total_grids}</span>
              <span>发现POI: {progress.total_pois}</span>
              <span className="flex items-center gap-1">
                状态:
                {progress.status === 'completed' ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : progress.status === 'failed' ? (
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-500" />
                )}
                {progress.status}
              </span>
            </div>
          </div>
        )}

        {/* 清洗 */}
        <div className="border-t pt-5">
          <h3 className="text-base font-semibold text-gray-700 mb-3">数据清洗</h3>
          <button
            onClick={handleClean}
            disabled={cleaning || collecting}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            {cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {cleaning ? '清洗中...' : '执行自动清洗'}
          </button>

          {cleanReport && (
            <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
              <p className="font-semibold mb-2">清洗报告</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                <span>清洗前总数: {cleanReport.total_before}</span>
                <span>清洗后总数: {cleanReport.total_after}</span>
                <span>移除零评分: {cleanReport.removed_zero_rating}</span>
                <span>移除非餐饮: {cleanReport.removed_non_restaurant}</span>
                <span>移除重复项: {cleanReport.removed_duplicates}</span>
                <span className="font-semibold">总计移除: {cleanReport.total_removed}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}