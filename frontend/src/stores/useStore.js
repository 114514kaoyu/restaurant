/**
 * Zustand 全局状态管理
 * 存储当前选中城市、快照、算法等全局状态
 */
import { create } from 'zustand'

const useStore = create((set) => ({
  // ---- 当前选中 ----
  currentCity: null,
  currentSnapshot: null,
  currentAlgorithm: 'wilson',

  // ---- 城市列表 ----
  cities: [],
  setCities: (cities) => set({ cities }),

  // ---- 操作 ----
  setCurrentCity: (city) => set({ currentCity: city, currentSnapshot: null }),
  setCurrentSnapshot: (snapshot) => set({ currentSnapshot: snapshot }),
  setCurrentAlgorithm: (algo) => set({ currentAlgorithm: algo }),

  // ---- 通知消息 ----
  toast: null,
  showToast: (message, type = 'success') => {
    set({ toast: { message, type, id: Date.now() } })
    setTimeout(() => set({ toast: null }), 3500)
  },
}))

export default useStore