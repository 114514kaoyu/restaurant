/**
 * 轮询 Hook
 * 每隔 interval 毫秒调用 callback, enabled 为 false 时停止
 */
import { useEffect, useRef } from 'react'

export default function usePolling(callback, interval = 2000, enabled = true) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return
    const tick = () => savedCallback.current()
    tick() // 立即执行一次
    const id = setInterval(tick, interval)
    return () => clearInterval(id)
  }, [interval, enabled])
}