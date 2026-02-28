import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Toast from './Toast'
import { Menu, X } from 'lucide-react'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* 主区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶栏 (移动端) */}
        <header className="flex h-14 items-center border-b bg-white px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-800">餐厅排名系统</h1>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* 全局 Toast */}
      <Toast />
    </div>
  )
}