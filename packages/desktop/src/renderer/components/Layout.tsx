import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useSDK } from '../contexts/SDKContext';

const navItems = [
  { path: '/dashboard', label: '首页', icon: '🏠' },
  { path: '/test', label: '测试', icon: '🧪' },
  { path: '/results', label: '结果', icon: '📊' },
  { path: '/settings', label: '设置', icon: '⚙️' },
];

export function Layout() {
  const { device, initialized, connecting } = useSDK();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-white flex flex-col">
        {/* Header with drag region */}
        <div className="h-12 drag-region flex items-center px-4 border-b border-gray-800">
          <span className="text-lg font-semibold no-drag">Hardware Test Agent</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-white border-l-2 border-green-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Device Status */}
        <div className="p-4 border-t border-gray-800">
          {!initialized ? (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 rounded-full bg-gray-500 mr-2 animate-pulse" />
              <span className="text-gray-400">初始化中...</span>
            </div>
          ) : connecting ? (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
              <span className="text-gray-400">连接中...</span>
            </div>
          ) : device ? (
            <div className="text-sm">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                <span className="text-green-400">已连接</span>
              </div>
              <div className="text-gray-400 text-xs pl-4">
                <p>{device.deviceType}</p>
                <p>{device.label}</p>
                <p>v{device.firmwareVersion}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
              <span className="text-gray-400">未连接设备</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
