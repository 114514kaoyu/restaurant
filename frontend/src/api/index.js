/**
 * 统一 API 封装
 * 所有接口函数在此导出, 页面直接调用
 */
import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// -------- 响应拦截: 统一错误处理 --------
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      '请求失败'
    console.error('[API Error]', msg)
    return Promise.reject(new Error(msg))
  }
)

// ======================== 城市管理 ========================

export function fetchCities() {
  return http.get('/cities')
}

export function createCity(data) {
  return http.post('/cities', data)
}

export function deleteCity(cityId) {
  return http.delete(`/cities/${cityId}`)
}

// ======================== 数据采集 ========================

export function startCollection(cityId, stepKm = 1.0) {
  return http.post(`/collection/start?city_id=${cityId}&step_km=${stepKm}`)
}

export function getCollectionStatus(snapshotId) {
  return http.get(`/collection/status/${snapshotId}`)
}

export function cleanData(snapshotId) {
  return http.post(`/collection/clean/${snapshotId}`)
}

// ======================== 餐厅查询 ========================

export function fetchRestaurants(params) {
  return http.get('/restaurants', { params })
}

export function fetchRestaurantDetail(id) {
  return http.get(`/restaurants/${id}`)
}

export function fetchCategories(snapshotId) {
  return http.get('/restaurants/categories', { params: { snapshot_id: snapshotId } })
}

export function fetchDistricts(snapshotId) {
  return http.get('/restaurants/districts', { params: { snapshot_id: snapshotId } })
}

// ======================== 排名 ========================

export function calculateRanking(data) {
  return http.post('/ranking/calculate', data)
}

export function fetchRankingList(params) {
  return http.get('/ranking/list', { params })
}

export function compareAlgorithms(snapshotId, topN = 20) {
  return http.get('/ranking/compare', { params: { snapshot_id: snapshotId, top_n: topN } })
}

export function fetchHiddenGems(params) {
  return http.get('/ranking/hidden-gems', { params })
}

export function fetchRecommendations(params) {
  return http.get('/ranking/recommend', { params })
}

// ======================== 统计分析 ========================

export function fetchOverview(snapshotId) {
  return http.get(`/analysis/overview/${snapshotId}`)
}

export function fetchCategoryStats(snapshotId) {
  return http.get(`/analysis/category-stats/${snapshotId}`)
}

export function fetchDistrictStats(snapshotId) {
  return http.get(`/analysis/district-stats/${snapshotId}`)
}

export function fetchPriceRating(snapshotId) {
  return http.get(`/analysis/price-rating/${snapshotId}`)
}

export function fetchRatingDistribution(snapshotId, binSize = 0.2) {
  return http.get(`/analysis/rating-distribution/${snapshotId}`, {
    params: { bin_size: binSize },
  })
}

export function fetchHeatmapData(snapshotId, algorithm, topPercent = 100) {
  return http.get(`/analysis/heatmap/${snapshotId}`, {
    params: { algorithm, top_percent: topPercent },
  })
}

// ======================== 导出 ========================

export function getExcelDownloadUrl(snapshotId, algorithm = 'wilson') {
  return `/api/export/excel/${snapshotId}?algorithm=${algorithm}`
}