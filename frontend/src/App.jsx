import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const CityManage = lazy(() => import('./pages/CityManage'))
const DataCollection = lazy(() => import('./pages/DataCollection'))
const RestaurantList = lazy(() => import('./pages/RestaurantList'))
const RankingView = lazy(() => import('./pages/RankingView'))
const AlgorithmCompare = lazy(() => import('./pages/AlgorithmCompare'))
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'))
const HiddenGems = lazy(() => import('./pages/HiddenGems'))
const RecommendPage = lazy(() => import('./pages/RecommendPage'))
const HeatmapPage = lazy(() => import('./pages/HeatmapPage'))

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cities" element={<CityManage />} />
          <Route path="/collection" element={<DataCollection />} />
          <Route path="/restaurants" element={<RestaurantList />} />
          <Route path="/ranking" element={<RankingView />} />
          <Route path="/compare" element={<AlgorithmCompare />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/hidden-gems" element={<HiddenGems />} />
          <Route path="/recommend" element={<RecommendPage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}