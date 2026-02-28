import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPin,
  Database,
  UtensilsCrossed,
  Trophy,
  GitCompare,
  BarChart3,
  Gem,
  ThumbsUp,
  Map,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/cities', label: '城市管理', icon: MapPin },
  { to: '/collection', label: '数据采集', icon: Database },
  { to: '/restaurants', label: '餐厅列表', icon: UtensilsCrossed },
  { to: '/ranking', label: '排名结果', icon: Trophy },
  { to: '/compare', label: '算法对比', icon: GitCompare },
  { to: '/analysis', label: '统计分析', icon: BarChart3 },
  { to: '/hidden-gems', label: '隐藏宝藏', icon: Gem },
  { to: '/recommend', label: '个性推荐', icon: ThumbsUp },
  { to: '/heatmap', label: '热力地图', icon: Map },
]

export default function Sidebar({ onClose }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary-600" />
          <span className="text-lg font-bold text-gray-800">餐厅排名</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 导航 */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* 底部 */}
      <div className="border-t p-4">
        <p className="text-xs text-gray-400 text-center">v1.0.0 · 毕业设计</p>
      </div>
    </div>
  )
}